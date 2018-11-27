import json
import logging
import os
import random
import string
import time

import requests

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


logger = logging.getLogger("rainbow")


class GalaxyClient:
    def __init__(self, base_url=None, api_key=None):
        self.base_url = base_url or settings.GALAXY_BASE_URL
        self.api_key = api_key or settings.GALAXY_ADMIN_USER_API_KEY
        if not self.base_url:
            raise Exception("You have to specify base_url if settings.GALAXY_BASE_URL is not configured")
        if not self.api_key:
            raise Exception("You have to specify api_key if settings.GALAXY_ADMIN_USER_API_KEY is not configured")
        self.api_url = os.path.join(self.base_url, 'api')

    def _api_url(self, relpath):
        relpath = relpath.lstrip('/')
        base = self.base_url if relpath.startswith('api/') else self.api_url
        return os.path.join(base, relpath)

    def get(self, relpath, **kwargs):
        params = {'key': self.api_key}
        params.update(kwargs)
        response = requests.get(self._api_url(relpath), params=params)
        if response.status_code != requests.codes.ok:
            raise Exception('Galaxy Error: %s' % response.text)
        return response.json()

    def post(self, relpath, **kwargs):
        return self.post_ll(relpath, data=kwargs)

    def put(self, relpath, obj):
        payload = json.dumps(obj)
        params = {
            'key': self.api_key
        }
        response = requests.put(
            self._api_url(relpath),
            data=payload,
            params=params,
            headers={'Content-Type': 'application/json'})
        if response.status_code != requests.codes.ok:
            raise Exception('Galaxy Error: %s' % response.text)
        return response.json()

    def post_ll(self, relpath, **kwargs):
        '''A low-level post giving more control on the arguments we pass to request'''
        new_args = kwargs.copy()
        new_args.setdefault('data', {})['key'] = self.api_key
        response = requests.post(self._api_url(relpath), **new_args)
        if response.status_code != requests.codes.ok:
            raise Exception('Galaxy Error: %s' % response.text)
        return response.json()


class GalaxyAPI:
    def __init__(self, client):
        self.client = client


class UserAPI(GalaxyAPI):
    def get_by_email(self, email):
        users = self.client.get('users', f_email=email)
        return users[0] if len(users) > 0 else None

    def create(self, email):
        username = email.replace('@', '_at_')
        password = generate_password()
        response = self.client.post('users', username=username, email=email, password=password)
        return response

    def get_api_key(self, user_id):
        response = self.client.get('users/%s/api_key/inputs' % user_id)
        inputs = response.get('inputs', [])
        for inp in inputs:
            if inp.get('name') == 'api-key':
                api_key = inp.get('value', 'Not available.')
                break
        return api_key if api_key != 'Not available.' else None

    def create_api_key(self, user_id):
        response = self.client.post('users/%s/api_key' % user_id)
        return response


class HistoryAPI(GalaxyAPI):
    def create(self, name):
        response = self.client.post('histories', name=name)
        return response

    def update(self, history):
        return self.client.put('histories/%s' % history['id'], history)

    def upload_file(self, history_id, filepath, filename=None, file_type=None):
        payload = {
            'tool_id': 'upload1',
            'history_id': history_id,
        }
        inputs = {
            'files_0|NAME': filename or os.path.basename(filepath),
            'files_0|type': 'upload_dataset',
            'dbkey': '?',
            'file_type': file_type or 'auto',
            'ajax_upload': 'true',
        }
        payload['inputs'] = json.dumps(inputs)

        with open(filepath, 'rb') as file_to_upload:
            files = {'files_0|file_data': file_to_upload}
            response = self.client.post_ll('tools', data=payload, files=files)
            return response['outputs'][0]['id']

    def get_file_state(self, history_id, file_id):
        hda_details = self.client.get('histories/%s/contents/%s' % (history_id, file_id))
        return hda_details['state']

    def wait_for_file_upload_to_finish(self, history_id, file_id):
        def get_state():
            hda_details = self.client.get('histories/%s/contents/%s' % (history_id, file_id))
            return hda_details['state']

        state = get_state()
        while state not in ('ok', 'error'):
            time.sleep(3)
            state = get_state()
        return state


class WorkflowAPI(GalaxyAPI):
    def get_by_name(self, name):
        workflows = self.client.get('workflows')
        for workflow in workflows:
            if workflow.get('name') == name:
                return workflow

    def get_by_tag(self, tag):
        '''Gets a workflow with the given tag set.

        If more than one worflow has the tag it will return the last modified workflow.'''
        workflows = self.client.get('workflows')
        matching_workflows = [wfl for wfl in workflows if tag in wfl.get('tags', [])]
        if len(matching_workflows) == 0:
            return None
        print([wfl['id'] for wfl in matching_workflows])
        return matching_workflows[0]

    def import_shared_workflow(self, workflow_id):
        return self.client.post('workflows', shared_workflow_id=workflow_id)

    def tag_workflow(self, workflow_id, new_tags):
        workflow = self.client.get('workflows/%s/download' % workflow_id)

        current_tags = set(workflow.setdefault('tags', []))
        workflow['tags'] += [tag for tag in new_tags if tag not in current_tags]

        return self.client.put('workflows/%s' % workflow_id, {'workflow': workflow})

    def run_simple(self, workflow_id, history_id, file_id):
        '''Runs a simple workflow that accepts just one input file'''
        ds_map = {'0': {'src': 'hda', 'id': file_id}}
        return self.client.post(
            'workflows',
            workflow_id=workflow_id,
            history='hist_id=%s' % history_id,
            ds_map=json.dumps(ds_map))


class Galaxy:
    def __init__(self, base_url=None, api_key=None):
        self.client = GalaxyClient(base_url, api_key)
        self.users = UserAPI(self.client)
        self.histories = HistoryAPI(self.client)
        self.workflows = WorkflowAPI(self.client)


def galaxy_ensure_user(email):
    """
    create a galaxy account if required. returns True if
    an account was created
    """
    admins_galaxy = Galaxy()
    galaxy_user = admins_galaxy.users.get_by_email(email)
    if galaxy_user is None:
        admins_galaxy.users.create(email)
        return True
    return False


def get_users_galaxy(email):
    '''Returns a galaxy client configured for the user who has the passed in email address.'''
    admins_galaxy = Galaxy()
    users_api_key = _get_users_galaxy_api_key(admins_galaxy, email)
    users_galaxy = Galaxy(api_key=users_api_key)
    return users_galaxy


def _get_users_galaxy_api_key(admins_galaxy, email):
    galaxy_user = admins_galaxy.users.get_by_email(email)
    api_key = admins_galaxy.users.get_api_key(galaxy_user['id'])
    if api_key is None:
        api_key = admins_galaxy.users.create_api_key(galaxy_user['id'])
    return api_key


def make_workflow_tag(krona_shared_wfl_id):
    return 'imported_from_shared_krona_workflow_id:%s' % krona_shared_wfl_id


def get_krona_workflow(email):
    krona_shared_wfl_id = settings.GALAXY_KRONA_WORKFLOW_ID
    if krona_shared_wfl_id == '':
        raise ImproperlyConfigured('Krona Workflow ID not set, please set settings.GALAXY_KRONA_WORKFLOW_ID')
    galaxy = get_users_galaxy(email)

    tag = make_workflow_tag(krona_shared_wfl_id)
    wfl = galaxy.workflows.get_by_tag(tag)
    if wfl is None:
        wfl = galaxy.workflows.import_shared_workflow(krona_shared_wfl_id)
        wfl = galaxy.workflows.tag_workflow(wfl['id'], [tag])

    return wfl['id']


def generate_password(length=32):
    return ''.join(random.SystemRandom().choice(string.ascii_letters + string.digits) for _ in range(length))

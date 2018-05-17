import json
import logging
import os
import random
import string
import time

import requests

from django.conf import settings


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

    def wait_for_file_upload_to_finish(self, history_id, file_id):
        def get_state():
            hda_details = self.client.get('histories/%s/contents/%s' % (history_id, file_id))
            return hda_details['state']

        state = get_state()
        # TODO also stop on error
        while state != 'ok':
            time.sleep(3)
            state = get_state()
        return state


class WorkflowAPI(GalaxyAPI):
    def get_by_name(self, name):
        workflows = self.client.get('workflows')
        for workflow in workflows:
            if workflow.get('name') == name:
                return workflow

    def submit(self, workflow_id, history_id, file_ids):
        ds_map = {k: {'src': 'hda', 'id': v} for k, v in file_ids.items()}
        response = self.client.post('workflows', workflow_id=workflow_id, history_id=history_id, ds_map=json.dumps(ds_map))
        return response


class Galaxy:
    def __init__(self, base_url=None, api_key=None):
        self.client = GalaxyClient(base_url, api_key)
        self.users = UserAPI(self.client)
        self.histories = HistoryAPI(self.client)
        self.workflows = WorkflowAPI(self.client)


def generate_password(length=32):
    return ''.join(random.SystemRandom().choice(string.ascii_letters + string.digits) for _ in range(length))

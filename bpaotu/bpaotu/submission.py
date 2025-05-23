import redis

from django.conf import settings
import logging


logger = logging.getLogger('rainbow')
redis_client = redis.StrictRedis(host=settings.REDIS_HOST, db=settings.REDIS_DB)


class Submission:
    """
    track a submission (Galaxy, BLAST, ...) as it progresses
    """

    def __init__(self, submission_id):
        self.submission_id = submission_id

    @staticmethod
    def create(submission_id):
        redis_client.hset(submission_id, 'id', submission_id)
        return Submission(submission_id)

    def __setattr__(self, name, value):
        if name == 'submission_id':
            object.__setattr__(self, name, value)
            return
        redis_client.hset(self.submission_id, name, value)

    def __getattr__(self, name):
        value = redis_client.hget(self.submission_id.encode('utf8'), name.encode('utf8'))
        return None if value is None else value.decode('utf8')


    def get_all_values(self):
        """
        Retrieve all fields and their values for this submission
        """
    
        values = redis_client.hgetall(self.submission_id)
    
        return {key.decode('utf8'): value.decode('utf8') for key, value in values.items()}

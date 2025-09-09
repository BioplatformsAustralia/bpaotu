import json
import redis

from .settings_shared import redis_url

redis_client = redis.StrictRedis.from_url(redis_url(), decode_responses=True)
# decode_responses=True automatically encodes keys and decodes values as UTF-8

class Submission:
    """Track a submission (BLAST, galaxy, comparison ...) as it progresses"""

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
        value = redis_client.hget(self.submission_id, name)
        return value

    def get_all_values(self):
        """Retrieve all fields and their values for this submission"""
        values = redis_client.hgetall(self.submission_id)
        return values

    def reset(self):
        """
        Reset state for a resubmission (clears error/results/timestamps/status).
        Compatible with redis-py < 3.5 and >= 3.5.
        """
        data = {
            'status': 'init',
            'timestamps': json.dumps([]),
            # 'results_files': '{}',
            'error': ''
        }
        try:
            # redis-py >= 3.5
            redis_client.hset(self.submission_id, mapping=data)
        except TypeError:
            # fallback for redis-py < 3.5
            redis_client.hmset(self.submission_id, data)

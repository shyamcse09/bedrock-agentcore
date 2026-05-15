import json
import os
from typing import List
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

class SubmissionSkill:
    def __init__(self, frontend_base_url: str | None = None):
        frontend_base_url = frontend_base_url or os.getenv('FRONTEND_API_URL', 'http://localhost:3000')
        self.api_url = frontend_base_url.rstrip('/') + '/api/answers'

    def submit_answers(self, session_id: str, answers: List[str]) -> dict:
        if not answers:
            raise ValueError('No answers provided for submission')

        payload = json.dumps({
            'sessionId': session_id,
            'answers': answers,
        }).encode('utf-8')

        request = Request(
            self.api_url,
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        try:
            with urlopen(request, timeout=15) as response:
                body = response.read().decode('utf-8')
                return json.loads(body)
        except HTTPError as e:
            raise RuntimeError(f'Frontend API returned {e.code}: {e.reason}')
        except URLError as e:
            raise RuntimeError(f'Unable to reach frontend API: {e.reason}')

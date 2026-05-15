import json
import os


def handler(event, context):
    session_id = event.get('sessionId')
    answers = event.get('answers', [])

    print(f'Notifying accountable users for session: {session_id}')
    print('Answers payload:')
    print(json.dumps(answers, indent=2))

    return {
        'status': 'notified',
        'sessionId': session_id,
        'answerCount': len(answers)
    }

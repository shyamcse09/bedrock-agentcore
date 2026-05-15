from typing import Dict, List, Tuple

QUESTIONS = [
    "What is the objective of this engagement?",
    "Please share the Site Name or URL relevant for this request.",
    "Who is the primary accountable owner for this task?",
    "Which organization should be notified after this request completes?",
    "What persona should be associated with this workflow?"
]

class QuestionnaireSkill:
    def __init__(self, sessions: Dict[str, dict]):
        self.sessions = sessions

    def start_session(self, session_id: str) -> Tuple[str, bool]:
        self.sessions[session_id] = {'current_index': 0, 'answers': []}
        return self.get_next_question(session_id)

    def record_answer(self, session_id: str, answer: str) -> Tuple[str, bool]:
        session = self.sessions.setdefault(session_id, {'current_index': 0, 'answers': []})
        session['answers'].append(answer.strip() if isinstance(answer, str) else '')
        session['current_index'] = session.get('current_index', 0) + 1
        self.sessions[session_id] = session
        return self.get_next_question(session_id)

    def get_next_question(self, session_id: str) -> Tuple[str, bool]:
        session = self.sessions.setdefault(session_id, {'current_index': 0, 'answers': []})
        current_index = session.get('current_index', 0)
        if current_index >= len(QUESTIONS):
            return "All workflow questions complete. Please submit your answers to save them.", True
        return QUESTIONS[current_index], False

    def get_answers(self, session_id: str) -> List[str]:
        session = self.sessions.get(session_id, {'current_index': 0, 'answers': []})
        return session.get('answers', [])

    def is_complete(self, session_id: str) -> bool:
        session = self.sessions.get(session_id, {'current_index': 0, 'answers': []})
        return session.get('current_index', 0) >= len(QUESTIONS)

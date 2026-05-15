from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid
import os
import json
import boto3
from dotenv import load_dotenv

from .skills import QuestionnaireSkill, SubmissionSkill

load_dotenv()

app = FastAPI()

# Initialize distinct Bedrock clients
bedrock_control = None
bedrock_runtime = None
bedrock_available = False

try:
    aws_region = os.getenv('AWS_REGION', 'us-east-1')
    
    # Control plane client (for metadata/listings)
    bedrock_control = boto3.client('bedrock', region_name=aws_region)
    
    # Data plane client (for model execution)
    bedrock_runtime = boto3.client('bedrock-runtime', region_name=aws_region)
    
    # Test availability using control client
    bedrock_control.list_foundation_models()
    bedrock_available = True
    print('✓ Bedrock client initialized and available')
except Exception as e:
    print(f'⚠ Bedrock not available: {e}')
    print('ℹ Falling back to local question generation')
    bedrock_available = False

# Store conversation history per session
sessions: dict[str, dict] = {}
questionnaire_skill = QuestionnaireSkill(sessions)
submission_skill = SubmissionSkill()

SYSTEM_PROMPT = """You are an ERM (Enterprise Resource Management) workflow assistant. Your job is to ask clarifying questions about a business decision or workflow. Ask ONE question at a time. Keep questions concise and professional. Focus on: objective, stakeholders, timeline, and organizational impact. After 5 questions, indicate the workflow is complete."""

# Fallback questions for when Bedrock is unavailable
FALLBACK_QUESTIONS = [
    "What is the objective of this engagement?",
    "Please share the Site Name or URL relevant for this request.",
    "Who is the primary accountable owner for this task?",
    "Which organization should be notified after this request completes?",
    "What persona should be associated with this workflow?"
]

class ChatRequest(BaseModel):
    command: str
    sessionId: Optional[str] = None
    answer: Optional[str] = None
    message: Optional[str] = None

class ChatResponse(BaseModel):
    sessionId: str
    message: str
    question: Optional[str] = None
    finished: bool

def get_question_from_bedrock(session_id: str, user_answer: Optional[str] = None) -> tuple[str, bool]:
    """Generate the next question using Claude via Bedrock Runtime client."""
    if not bedrock_available or bedrock_runtime is None:
        raise HTTPException(status_code=503, detail="Bedrock service not available")
        
    session = sessions.get(session_id, {'messages': [], 'count': 0})
    question_count = session['count']
    
    # If we've asked 5 questions, we're done
    if question_count >= 5:
        return "All workflow questions complete. Please submit your answers.", True
        
    # Append the user's explicit answer if provided
    if user_answer:
        session['messages'].append({
            'role': 'user',
            'content': [{'text': user_answer}]
        })
        
    # Construct the instruction text
    if question_count == 0:
        instruction = "Start the ERM workflow by asking the first clarifying question about the business decision or workflow."
    else:
        instruction = f"Based on the previous answer, ask the next question (question {question_count + 1} of 5)."
        
    # Temporary array to avoid dirtying session history with guiding instructions
    request_messages = list(session['messages'])
    
    # If there are no messages or the last message was from the assistant, add user context
    if not request_messages or request_messages[-1]['role'] == 'assistant':
        request_messages.append({
            'role': 'user',
            'content': [{'text': instruction}]
        })
    else:
        # Append instruction directly to the content of the user's answer payload
        request_messages[-1]['content'].append({'text': f"\n\n[Instruction: {instruction}]"})
        
    try:
        # Use bedrock_runtime instead of bedrock_client
        response = bedrock_runtime.converse(
            modelId='us.anthropic.claude-haiku-4-5-20251001-v1:0',
            system=[{'text': SYSTEM_PROMPT}],
            messages=request_messages
        )
        
        question = response['output']['message']['content'][0]['text']
        
        # Commit the generated question into the actual conversation history
        session['messages'].append({
            'role': 'assistant',
            'content': [{'text': question}]
        })
        
        session['count'] = question_count + 1
        sessions[session_id] = session
        return question, False
        
    except Exception as e:
        print(f'Error calling Bedrock Runtime: {e}')
        return get_question_from_fallback(session_id, question_count)

def get_chat_response(session_id: str, user_message: str) -> str:
    """Handle free-form chat messages using Bedrock or fallback."""
    if not user_message or not user_message.strip():
        return "Hi! I am your ERM assistant. Ask me anything about RACI roles, workflow planning, or decision tracking."
    
    session = sessions.get(session_id, {'messages': [], 'count': 0})
    
    # Add user message to conversation history
    session['messages'].append({
        'role': 'user',
        'content': [{'text': user_message}]
    })
    
    # Try Bedrock first
    if bedrock_available and bedrock_runtime:
        try:
            response = bedrock_runtime.converse(
                modelId='us.anthropic.claude-haiku-4-5-20251001-v1:0',
                system=[{'text': SYSTEM_PROMPT}],
                messages=session['messages']
            )
            
            assistant_response = response['output']['message']['content'][0]['text']
            
            # Add assistant response to history
            session['messages'].append({
                'role': 'assistant',
                'content': [{'text': assistant_response}]
            })
            
            sessions[session_id] = session
            return assistant_response
            
        except Exception as e:
            print(f'Bedrock chat failed: {e}')
    
    # Fallback to simple responses
    normalized = user_message.lower().strip()
    
    if 'hello' in normalized or 'hi' in normalized:
        return "Hello! I'm here to help with ERM workflows and RACI planning. What would you like to discuss?"
    
    if 'raci' in normalized:
        return "RACI stands for Responsible, Accountable, Consulted, and Informed. Each role has specific responsibilities in decision-making. Would you like me to explain each role in detail?"
    
    if 'objective' in normalized or 'goal' in normalized:
        return "A clear objective is essential for any workflow. What specific outcome are you trying to achieve?"
    
    if 'workflow' in normalized:
        return "Workflows help organize tasks and responsibilities. I can help you design RACI-based workflows. What type of process are you working on?"
    
    # Default response
    return "I understand you're asking about: " + user_message[:50] + "... Can you tell me more about your ERM workflow needs?"

def get_question_from_fallback(session_id: str, question_count: int) -> tuple[str, bool]:
    """Fallback question generation using local list."""
    if question_count >= len(FALLBACK_QUESTIONS):
        return "All workflow questions complete. Please submit your answers.", True
    question = FALLBACK_QUESTIONS[question_count]
    sessions[session_id] = {'messages': [], 'count': question_count + 1}
    return question, False

def get_question(session_id: str, user_answer: Optional[str] = None) -> tuple[str, bool]:
    """Get the next question - uses Bedrock if available, otherwise falls back."""
    try:
        if bedrock_available and bedrock_runtime:
            return get_question_from_bedrock(session_id, user_answer)
    except HTTPException:
        raise
    except Exception as e:
        print(f'Bedrock call failed: {e}, using fallback')
        
    session = sessions.get(session_id, {'messages': [], 'count': 0})
    question_count = session['count']
    return get_question_from_fallback(session_id, question_count)

@app.post('/qa', response_model=ChatResponse)
async def qa(payload: ChatRequest):
    if payload.command == 'start':
        session_id = payload.sessionId or str(uuid.uuid4())
        try:
            question, finished = questionnaire_skill.start_session(session_id)
            return ChatResponse(sessionId=session_id, message=question, question=question, finished=finished)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    if payload.command == 'answer':
        session_id = payload.sessionId or str(uuid.uuid4())
        if session_id not in sessions:
            sessions[session_id] = {'current_index': 0, 'answers': []}
        if not payload.answer:
            raise HTTPException(status_code=400, detail='Answer is required for this command')
        try:
            question, finished = questionnaire_skill.record_answer(session_id, payload.answer)
            return ChatResponse(sessionId=session_id, message=question, question=question, finished=finished)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    if payload.command == 'submit':
        session_id = payload.sessionId or str(uuid.uuid4())
        if session_id not in sessions:
            raise HTTPException(status_code=400, detail='Unknown session')
        answers = questionnaire_skill.get_answers(session_id)
        try:
            result = submission_skill.submit_answers(session_id, answers)
            return ChatResponse(sessionId=session_id, message='Answers submitted successfully.', question='Submission complete', finished=True)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    if payload.command == 'chat':
        session_id = payload.sessionId or str(uuid.uuid4())
        if session_id not in sessions:
            sessions[session_id] = {'messages': [], 'count': 0}
        
        # For free-form chat, use the message field
        user_message = payload.message or payload.answer or ""
        try:
            response_text = get_chat_response(session_id, user_message)
            return ChatResponse(sessionId=session_id, message=response_text, question=response_text, finished=False)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    raise HTTPException(status_code=400, detail='Invalid command')

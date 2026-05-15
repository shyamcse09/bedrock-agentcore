# AWS Bedrock Claude Integration Guide

## Current Status

The ERM solution is now integrated with **AWS Bedrock Claude** for intelligent question generation. The system includes:

- ✅ **Fallback Mode** (Currently Active): Uses local predefined questions when Bedrock is unavailable
- 🔄 **Bedrock Mode** (Ready to Enable): Uses Claude 3 Sonnet for dynamic, context-aware questions

## Quick Start

### 1. Configure AWS Credentials

The backend automatically detects your AWS credentials via boto3. Use one of these methods:

**Option A: AWS CLI (Recommended)**
```bash
aws configure
# Follow the prompts to enter:
# - AWS Access Key ID
# - AWS Secret Access Key  
# - Default region: us-east-1
```

**Option B: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
export AWS_REGION=us-east-1
```

**Option C: AWS Credentials File**
Edit `~/.aws/credentials`:
```
[default]
aws_access_key_id = YOUR_ACCESS_KEY_ID
aws_secret_access_key = YOUR_SECRET_ACCESS_KEY
```

### 2. Enable Bedrock Model Access

To use Bedrock's Claude model, you must enable it in your AWS account:

1. Open [AWS Bedrock Console](https://console.aws.amazon.com/bedrock)
2. In the left sidebar, click **Model access**
3. Click the **Manage model access** button
4. Find **Anthropic Claude 3 Sonnet** in the list
5. Click the checkbox to select it
6. Click **Request access** (usually approved instantly)
7. Wait for the status to show as **Access granted**

### 3. Update Backend Configuration (Optional)

Edit `agentcore/.env.local` if your AWS region is not `us-east-1`:

```env
AWS_REGION=us-west-2
```

### 4. Start the Application

```bash
# Terminal 1: Start the frontend (from web/)
npm run dev

# Terminal 2: Start the backend (from agentcore/app/)
cd agentcore/app
source .venv/bin/activate
uvicorn main:app --reload
```

The application will:
- ✅ Use **Bedrock Claude** if the model is enabled and accessible
- ✅ Automatically fall back to **local questions** if Bedrock is unavailable
- ✅ Log which mode is active on startup

## Monitoring Bedrock Usage

Check the backend terminal output for these messages:

**Bedrock Active:**
```
✓ Bedrock client initialized and available
```

**Using Fallback:**
```
⚠ Bedrock not available: [reason]
ℹ Falling back to local question generation
```

## How It Works

### Question Flow with Bedrock

1. **Start Chat**: Backend requests first question from Claude
2. **Get Answer**: User submits answer, sent to Claude with conversation history
3. **Generate Next**: Claude generates contextual follow-up question
4. **Repeat**: Steps 2-3 continue until workflow complete (typically 5 questions)
5. **Submit**: User submits all answers to database and triggers Step Functions

### Question Flow with Fallback

Uses a predefined list of 5 ERM workflow questions:
1. "What is the objective of this engagement?"
2. "Please share the Site Name or URL relevant for this request."
3. "Who is the primary accountable owner for this task?"
4. "Which organization should be notified after this request completes?"
5. "What persona should be associated with this workflow?"

## Troubleshooting

### "ValidationException: The provided model identifier is invalid"

**Cause**: Claude 3 Sonnet model not enabled in your AWS account

**Solution**:
1. Go to [AWS Bedrock Model Access](https://console.aws.amazon.com/bedrock/home?#/modelaccess)
2. Search for "Claude"
3. Enable the Claude model you want to use
4. Wait a moment for access to be granted
5. Restart the backend

### "Bedrock not available" but AWS credentials are configured

**Possible causes**:
- Model not enabled (see above)
- Wrong AWS region configured
- IAM user lacks `bedrock:InvokeModel` permission

**Troubleshooting steps**:
1. Verify model is enabled in AWS console
2. Check `agentcore/.env.local` for correct region
3. Verify IAM permissions include `bedrock:InvokeModel` and `bedrock:ListFoundationModels`
4. Test AWS credentials: `aws sts get-caller-identity`

### "ModuleNotFoundError: No module named 'boto3'"

**Solution**: Reinstall dependencies
```bash
cd agentcore/app
source .venv/bin/activate
pip install -r requirements.txt
```

## Architecture

```
Frontend (Next.js 3000)
    ↓
Backend API (FastAPI 8000)
    ├─→ Try: AWS Bedrock Claude (intelligent Q&A)
    └─→ Fallback: Local question list
    ↓
Database (SQLite)
    ├─ UserAssignments (RACI users)
    └─ QuestionAnswers (submitted responses)
    ↓
AWS Step Functions (notifications)
```

## Development Notes

### Switching Models

To use a different Claude model, edit `agentcore/app/main.py`:

```python
response = bedrock_client.converse(
    modelId='anthropic.claude-3-5-sonnet-20241022',  # ← Change this
    system=[{'text': SYSTEM_PROMPT}],
    messages=session['messages']
)
```

Available models:
- `anthropic.claude-3-sonnet-20240229` (Standard)
- `anthropic.claude-3-5-sonnet-20241022` (Latest, if available)
- `anthropic.claude-3-haiku-20240307` (Faster, cheaper)

### System Prompt Customization

The system prompt is defined in `agentcore/app/main.py`:

```python
SYSTEM_PROMPT = """You are an ERM (Enterprise Resource Management) workflow assistant. 
..."""
```

Modify this to customize Claude's behavior for your specific workflow.

## Costs

AWS Bedrock pricing varies by model:
- **Claude 3 Sonnet**: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- **Claude 3 Haiku**: ~$0.00025 per 1K input tokens, ~$0.00125 per 1K output tokens

For a typical 5-question workflow: ~$0.01-0.05 per user session

## Next Steps

1. ✅ Enable Bedrock model in your AWS account
2. ✅ Configure AWS credentials
3. ✅ Restart backend to activate Bedrock mode
4. ✅ Test the full flow: Chat → Submit → View in Submissions
5. 📋 Optional: Deploy to AWS (see Infrastructure section)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend terminal output for error messages
3. Verify AWS Bedrock model access is granted
4. Check AWS CloudWatch logs for backend errors

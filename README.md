# ERM Solution

This repository implements a full-stack Next.js application with:

- Full-screen chatbot UI (with AWS Bedrock Claude or fallback questions)
- User management for RACI roles, organizations, personas, and site URL
- Backend database with Prisma
- FastAPI backend service for question-answer chat flow
- AWS Step Functions workflow for notifying accountable users after answers are submitted

**Status**: ✅ **Fully functional with fallback questions**. See [Bedrock Setup Guide](./BEDROCK_SETUP.md) to enable AI-powered intelligent questions.

## Structure

- `web/` — Next.js frontend and API routes
- `agentcore/` — FastAPI backend with AWS Bedrock Claude integration for intelligent Q&A
  - Uses Claude for dynamic question generation (with automatic fallback)
  - Maintains conversation history per session
  - Deployed locally or to AWS via Terraform

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- AWS Account (optional, for Bedrock AI features)

**For Bedrock AI Features**:
- AWS CLI configured with your credentials
- `bedrock:InvokeModel` permission in your AWS IAM policy
- Claude 3 model enabled in AWS Bedrock console

### Enable AWS Bedrock (Optional)

To unlock AI-powered intelligent questions, see [Bedrock Setup Guide](./BEDROCK_SETUP.md) for detailed instructions.

## Getting Started


1. Install Node dependencies in `web/`:

   ```bash
   cd erm-solution/web
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

2. Start the AgentCore backend locally:

   ```bash
   cd erm-solution/agentcore/app
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   **Note**: The backend will automatically:
   - Use AWS Bedrock Claude if your AWS credentials are configured and the model is enabled
   - Fall back to local predefined questions if Bedrock is not available

3. **(Optional) Enable AWS Bedrock for AI-powered questions**:

   See [Bedrock Setup Guide](./BEDROCK_SETUP.md) for complete instructions on:
   - Configuring AWS credentials
   - Enabling Claude models in AWS Bedrock console
   - Troubleshooting connection issues

4. Configure `agentcore/.env.local` if using non-default AWS region:

   ```env
   AWS_REGION=us-east-1
   ```

5. Deploy infrastructure with Terraform (instead of CDK) once configured:

   ```bash
   cd erm-solution/agentcore/terraform
   terraform init
   terraform apply
   ```


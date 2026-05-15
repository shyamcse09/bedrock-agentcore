# Terraform deployment for ERM notification workflow

This directory contains Terraform configuration to provision the AWS Lambda and Step Functions resources used by the ERM workflow.

## Resources created

- `aws_lambda_function.notify_accountable`
- `aws_iam_role.lambda_exec`
- `aws_iam_role_policy.lambda_logs`
- `aws_iam_role.sfn_role`
- `aws_iam_role_policy.sfn_invoke_lambda`
- `aws_sfn_state_machine.erm_notification`

## Usage

1. Install Terraform.
2. Navigate to the folder:

   ```bash
   cd erm-solution/agentcore/terraform
   ```

3. Initialize Terraform:

   ```bash
   terraform init
   ```

4. Apply the configuration:

   ```bash
   terraform apply
   ```

5. After apply finishes, copy the `state_machine_arn` output into `erm-solution/web/.env.local` as `AWS_STEP_FUNCTION_ARN`.

Example `.env.local` entry:

```env
AWS_STEP_FUNCTION_ARN="arn:aws:states:us-east-1:123456789012:stateMachine:ErmNotificationStateMachine"
```

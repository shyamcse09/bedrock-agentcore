output "state_machine_arn" {
  description = "ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.erm_notification.arn
}

output "lambda_function_arn" {
  description = "ARN of the notification Lambda function"
  value       = aws_lambda_function.notify_accountable.arn
}

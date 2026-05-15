terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "archive_file" "lambda_package" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_iam_role" "lambda_exec" {
  name = "erm_notify_accountable_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_logs" {
  name   = "erm_notify_accountable_lambda_logs"
  role   = aws_iam_role.lambda_exec.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "arn:aws:logs:*:*:*"
    }]
  })
}

resource "aws_lambda_function" "notify_accountable" {
  function_name = "NotifyAccountableFunction"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "notify_accountable.handler"
  runtime       = "python3.11"
  filename      = data.archive_file.lambda_package.output_path
  source_code_hash = data.archive_file.lambda_package.output_base64sha256

  environment {
    variables = {
      LOG_LEVEL = "INFO"
    }
  }
}

resource "aws_iam_role" "sfn_role" {
  name = "erm_notification_state_machine_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "states.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "sfn_invoke_lambda" {
  name   = "erm_sfn_invoke_lambda"
  role   = aws_iam_role.sfn_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "lambda:InvokeFunction"
      Resource = aws_lambda_function.notify_accountable.arn
    }]
  })
}

resource "aws_sfn_state_machine" "erm_notification" {
  name     = var.state_machine_name
  role_arn = aws_iam_role.sfn_role.arn

  definition = jsonencode({
    StartAt = "NotifyAccountable"
    States = {
      NotifyAccountable = {
        Type       = "Task"
        Resource   = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.notify_accountable.arn
          Payload = {
            "sessionId.$" = "$.sessionId"
            "answers.$"   = "$.answers"
          }
        }
        ResultPath = "$.notificationResult"
        Next       = "NotificationSent"
      }
      NotificationSent = {
        Type = "Succeed"
      }
    }
  })

  tags = {
    Project = "ERM Solution"
  }
}

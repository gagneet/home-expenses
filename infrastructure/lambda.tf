# infrastructure/lambda.tf
# Lambda function for processing statements
resource "aws_lambda_function" "process_statements" {
  function_name = "${local.name_prefix}-process-statements"
  description   = "Process bank statements and generate financial summaries"
  
  filename         = "../backend/deployment-package.zip"
  source_code_hash = filebase64sha256("../backend/deployment-package.zip")
  
  handler     = "app.main.lambda_handler"
  runtime     = var.lambda_runtime
  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout
  
  role = aws_iam_role.lambda_role.arn
  
  environment {
    variables = {
      ENVIRONMENT     = var.environment
      S3_BUCKET       = aws_s3_bucket.statements.bucket
      RESULTS_BUCKET  = aws_s3_bucket.results.bucket
      DYNAMODB_TABLE  = aws_dynamodb_table.results_table.name
      LOG_LEVEL       = var.environment == "prod" ? "INFO" : "DEBUG"
      CORS_ORIGINS    = join(",", var.cors_allowed_origins)
    }
  }
  
  # Enable tracing with AWS X-Ray
  tracing_config {
    mode = "Active"
  }
  
  tags = local.tags
}

# CloudWatch log group for Lambda function
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.process_statements.function_name}"
  retention_in_days = var.log_retention_days
  
  tags = local.tags
}

# IAM role for Lambda function
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.tags
}

# IAM policy for Lambda to access S3 buckets
resource "aws_iam_policy" "lambda_s3_access" {
  name        = "${local.name_prefix}-lambda-s3-access"
  description = "Allow Lambda to access S3 buckets for statements and results"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.statements.arn,
          "${aws_s3_bucket.statements.arn}/*",
          aws_s3_bucket.results.arn,
          "${aws_s3_bucket.results.arn}/*"
        ]
      }
    ]
  })
  
  tags = local.tags
}

# IAM policy for Lambda to access DynamoDB
resource "aws_iam_policy" "lambda_dynamodb_access" {
  name        = "${local.name_prefix}-lambda-dynamodb-access"
  description = "Allow Lambda to access DynamoDB table for storing results"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.results_table.arn
      }
    ]
  })
  
  tags = local.tags
}

# IAM policy for Lambda to use KMS key
resource "aws_iam_policy" "lambda_kms_access" {
  name        = "${local.name_prefix}-lambda-kms-access"
  description = "Allow Lambda to use KMS key for encryption/decryption"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.encryption_key.arn
      }
    ]
  })
  
  tags = local.tags
}

# IAM policy for Lambda CloudWatch logging
resource "aws_iam_policy" "lambda_logging" {
  name        = "${local.name_prefix}-lambda-logging"
  description = "Allow Lambda to write logs to CloudWatch"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
  
  tags = local.tags
}

# IAM policy for X-Ray tracing
resource "aws_iam_policy" "lambda_xray" {
  name        = "${local.name_prefix}-lambda-xray"
  description = "Allow Lambda to write X-Ray traces"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
  
  tags = local.tags
}

# Attach policies to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_s3_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_s3_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_kms_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_kms_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_logging_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_iam_role_policy_attachment" "lambda_xray_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_xray.arn
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.process_statements.function_name
  principal     = "apigateway.amazonaws.com"
  
  source_arn = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"
}
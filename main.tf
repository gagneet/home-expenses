# AWS Provider Configuration
provider "aws" {
  region = "us-east-1"
}

# S3 Bucket for Frontend
resource "aws_s3_bucket" "frontend" {
  bucket = "home-expenses-frontend"
  
  # Prevent public access
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for Statement Storage (Encrypted)
resource "aws_s3_bucket" "statements" {
  bucket = "home-expenses-statements"
  
  # Enable versioning for audit trail
  versioning {
    enabled = true
  }
  
  # Server-side encryption
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
  
  # Lifecycle policy to expire statements after processing
  lifecycle_rule {
    id      = "delete-after-processing"
    enabled = true
    
    expiration {
      days = 1
    }
  }
}

# Lambda Function for Statement Processing
resource "aws_lambda_function" "process_statements" {
  function_name = "process-financial-statements"
  runtime       = "python3.9"
  handler       = "app.lambda_handler"
  timeout       = 300
  memory_size   = 1024
  
  # Reference to your deployment package
  filename      = "lambda_deployment_package.zip"
  
  environment {
    variables = {
      STATEMENTS_BUCKET = aws_s3_bucket.statements.bucket
      RESULTS_TABLE     = aws_dynamodb_table.results.name
    }
  }
  
  # Function role with minimal permissions
  role = aws_iam_role.lambda_exec.arn
}

# DynamoDB Table for Results
resource "aws_dynamodb_table" "results" {
  name           = "financial-calculation-results"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "user_id"
  range_key      = "timestamp"
  
  attribute {
    name = "user_id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "S"
  }
  
  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }
  
  # Enable server-side encryption
  server_side_encryption {
    enabled = true
  }
}

# API Gateway
resource "aws_apigatewayv2_api" "api" {
  name          = "home-expenses-api"
  protocol_type = "HTTP"
}

# API Gateway Routes
resource "aws_apigatewayv2_route" "upload" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /upload"
  target    = "integrations/${aws_apigatewayv2_integration.upload.id}"
}

# WAF Web ACL for API Security
resource "aws_wafv2_web_acl" "api_waf" {
  name        = "finance-api-waf"
  scope       = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  # Rule to prevent SQL injection
  rule {
    name     = "SQLiRule"
    priority = 1
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiRule"
      sampled_requests_enabled   = true
    }
  }
  
  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 2
    
    statement {
      rate_based_statement {
        limit              = 100
        aggregate_key_type = "IP"
      }
    }
    
    action {
      block {}
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "finance-api-waf"
    sampled_requests_enabled   = true
  }
}

# CloudWatch Alarms for Security Monitoring
resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This alarm monitors for API 5XX errors"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  
  dimensions = {
    ApiName = aws_apigatewayv2_api.api.name
  }
}

# SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts" {
  name = "finance-security-alerts"
  
  # Enable encryption for the SNS topic
  kms_master_key_id = aws_kms_key.sns.id
}

# KMS Key for SNS Encryption
resource "aws_kms_key" "sns" {
  description         = "KMS key for SNS topic encryption"
  enable_key_rotation = true
}

# IAM Role for Lambda with Minimal Permissions
resource "aws_iam_role" "lambda_exec" {
  name = "finance-lambda-role"
  
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
}

# Attach minimal permissions to Lambda role
resource "aws_iam_role_policy" "lambda_s3_access" {
  name   = "s3-read-write"
  role   = aws_iam_role.lambda_exec.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.statements.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_dynamodb_access" {
  name   = "dynamodb-read-write"
  role   = aws_iam_role.lambda_exec.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem"
        ]
        Effect = "Allow"
        Resource = [
          aws_dynamodb_table.results.arn
        ]
      }
    ]
  })
}

# CloudTrail for Auditing
resource "aws_cloudtrail" "finance_audit" {
  name                          = "finance-audit-trail"
  s3_bucket_name                = aws_s3_bucket.audit_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  
  # Enable CloudWatch Logs integration
  cloud_watch_logs_group_arn = aws_cloudwatch_log_group.cloudtrail.arn
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_to_cloudwatch.arn
}

# S3 Bucket for Audit Logs
resource "aws_s3_bucket" "audit_logs" {
  bucket = "finance-audit-logs"
  
  # Server-side encryption
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
  
  # Lock down access
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/finance-audit"
  retention_in_days = 90
}

# IAM Role for CloudTrail to CloudWatch
resource "aws_iam_role" "cloudtrail_to_cloudwatch" {
  name = "cloudtrail-to-cloudwatch"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })
}

# Outputs
output "api_endpoint" {
  value = aws_apigatewayv2_api.api.api_endpoint
}

output "frontend_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

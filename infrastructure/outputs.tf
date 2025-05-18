# infrastructure/outputs.tf
output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.api_gateway.api_endpoint
}

output "frontend_url" {
  description = "CloudFront distribution URL for the frontend"
  value       = "https://${aws_cloudfront_distribution.frontend_distribution.domain_name}"
}

output "s3_frontend_bucket" {
  description = "S3 bucket for frontend static files"
  value       = aws_s3_bucket.frontend.bucket
}

output "s3_statements_bucket" {
  description = "S3 bucket for statement uploads"
  value       = aws_s3_bucket.statements.bucket
}

output "s3_results_bucket" {
  description = "S3 bucket for processing results"
  value       = aws_s3_bucket.results.bucket
}

output "dynamodb_results_table" {
  description = "DynamoDB table for results"
  value       = aws_dynamodb_table.results_table.name
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.process_statements.function_name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for Lambda"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "api_gateway_stage" {
  description = "API Gateway stage"
  value       = aws_apigatewayv2_stage.default.name
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "environment" {
  description = "Deployment environment"
  value       = var.environment
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend_distribution.id
}

output "waf_web_acl" {
  description = "WAF Web ACL ID (if enabled)"
  value       = var.enable_waf ? aws_wafv2_web_acl.api_waf[0].id : "WAF not enabled"
}

output "sns_alarm_topic" {
  description = "SNS topic ARN for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "cloudtrail_name" {
  description = "CloudTrail name (if enabled)"
  value       = var.enable_cloudtrail ? aws_cloudtrail.audit_trail[0].name : "CloudTrail not enabled"
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.encryption_key.id
}

output "api_key" {
  description = "API key for authentication (if enabled)"
  value       = var.enable_api_auth ? aws_apigatewayv2_api_key.api_key[0].name : "API authentication not enabled"
  sensitive   = true
}
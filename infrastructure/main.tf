# infrastructure/main.tf
# AWS Provider Configuration
provider "aws" {
  region = var.aws_region
}

# Define locals for resource naming and tagging
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Create SSM parameter for API URL (used by frontend)
resource "aws_ssm_parameter" "api_url" {
  name        = "/${var.project_name}/${var.environment}/api_url"
  description = "API Gateway URL for the Finance Calculator API"
  type        = "String"
  value       = aws_apigatewayv2_api.api_gateway.api_endpoint
  
  tags = local.tags
}

# Create SSM parameter for Frontend URL (for CORS configuration)
resource "aws_ssm_parameter" "frontend_url" {
  name        = "/${var.project_name}/${var.environment}/frontend_url"
  description = "Frontend URL for the Finance Calculator"
  type        = "String"
  value       = "https://${aws_cloudfront_distribution.frontend_distribution.domain_name}"
  
  tags = local.tags
}

# Create AWS KMS key for encryption
resource "aws_kms_key" "encryption_key" {
  description             = "${local.name_prefix}-encryption-key"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = local.tags
}

# Create KMS key alias for easier reference
resource "aws_kms_alias" "encryption_key_alias" {
  name          = "alias/${local.name_prefix}-encryption-key"
  target_key_id = aws_kms_key.encryption_key.key_id
}
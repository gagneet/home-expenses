# infrastructure/security.tf
# AWS Security Group for Lambda (if deployed in VPC)
resource "aws_security_group" "lambda_sg" {
  count = var.environment == "prod" ? 1 : 0  # Only create in production
  
  name        = "${local.name_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  
  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # No inbound traffic allowed (Lambda is invoked by other AWS services)
  
  tags = local.tags
}

# AWS CloudTrail for audit logging
resource "aws_cloudtrail" "audit_trail" {
  count = var.enable_cloudtrail ? 1 : 0
  
  name                          = "${local.name_prefix}-audit-trail"
  s3_bucket_name                = aws_s3_bucket.audit_logs[0].id
  s3_key_prefix                 = "audit-logs"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  
  # Enable CloudWatch Logs integration for real-time monitoring
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch_role[0].arn
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_logs[0].arn}:*"
  
  # KMS encryption for audit logs
  kms_key_id = aws_kms_key.encryption_key.arn
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.statements.arn}/", "${aws_s3_bucket.results.arn}/"]
    }
    
    data_resource {
      type   = "AWS::Lambda::Function"
      values = [aws_lambda_function.process_statements.arn]
    }
  }
  
  tags = local.tags
}

# S3 bucket for CloudTrail audit logs
resource "aws_s3_bucket" "audit_logs" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = "${local.name_prefix}-audit-logs"
  
  # Force destruction of bucket during terraform destroy
  force_destroy = true
  
  tags = local.tags
}

# Block public access to audit logs bucket
resource "aws_s3_bucket_public_access_block" "audit_logs_public_access" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.audit_logs[0].id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable server-side encryption for audit logs bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs_encryption" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.audit_logs[0].id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# CloudTrail bucket policy
resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.audit_logs[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.audit_logs[0].arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit_logs[0].arn}/audit-logs/AWSLogs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail_logs" {
  count = var.enable_cloudtrail ? 1 : 0
  
  name              = "/aws/cloudtrail/${local.name_prefix}"
  retention_in_days = var.log_retention_days
  
  tags = local.tags
}

# IAM Role for CloudTrail CloudWatch integration
resource "aws_iam_role" "cloudtrail_cloudwatch_role" {
  count = var.enable_cloudtrail ? 1 : 0
  
  name = "${local.name_prefix}-cloudtrail-cloudwatch-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = local.tags
}

# IAM Policy for CloudTrail CloudWatch integration
resource "aws_iam_policy" "cloudtrail_cloudwatch_policy" {
  count = var.enable_cloudtrail ? 1 : 0
  
  name        = "${local.name_prefix}-cloudtrail-cloudwatch-policy"
  description = "Allow CloudTrail to send logs to CloudWatch"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail_logs[0].arn}:*"
      }
    ]
  })
  
  tags = local.tags
}

# Attach policy to CloudTrail CloudWatch role
resource "aws_iam_role_policy_attachment" "cloudtrail_cloudwatch_attach" {
  count = var.enable_cloudtrail ? 1 : 0
  
  role       = aws_iam_role.cloudtrail_cloudwatch_role[0].name
  policy_arn = aws_iam_policy.cloudtrail_cloudwatch_policy[0].arn
}

# AWS Config (for additional security and compliance)
resource "aws_config_configuration_recorder" "config_recorder" {
  count = var.environment == "prod" ? 1 : 0  # Only in production
  
  name     = "${local.name_prefix}-config-recorder"
  role_arn = aws_iam_role.config_role[0].arn
  
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# IAM Role for AWS Config
resource "aws_iam_role" "config_role" {
  count = var.environment == "prod" ? 1 : 0
  
  name = "${local.name_prefix}-config-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = local.tags
}

# Attach AWS managed policy for Config
resource "aws_iam_role_policy_attachment" "config_policy_attach" {
  count = var.environment == "prod" ? 1 : 0
  
  role       = aws_iam_role.config_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# S3 bucket for AWS Config
resource "aws_s3_bucket" "config_bucket" {
  count = var.environment == "prod" ? 1 : 0
  
  bucket = "${local.name_prefix}-config"
  
  force_destroy = true
  
  tags = local.tags
}

# Block public access to Config bucket
resource "aws_s3_bucket_public_access_block" "config_bucket_public_access" {
  count = var.environment == "prod" ? 1 : 0
  
  bucket = aws_s3_bucket.config_bucket[0].id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Config bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket_encryption" {
  count = var.environment == "prod" ? 1 : 0
  
  bucket = aws_s3_bucket.config_bucket[0].id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# AWS Config delivery channel
resource "aws_config_delivery_channel" "config_delivery_channel" {
  count = var.environment == "prod" ? 1 : 0
  
  name           = "${local.name_prefix}-config-delivery"
  s3_bucket_name = aws_s3_bucket.config_bucket[0].bucket
  
  snapshot_delivery_properties {
    delivery_frequency = "Six_Hours"
  }
  
  depends_on = [aws_config_configuration_recorder.config_recorder]
}
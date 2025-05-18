# infrastructure/dynamodb.tf
# DynamoDB table for storing processing results
resource "aws_dynamodb_table" "results_table" {
  name         = "${local.name_prefix}-${var.dynamodb_table_name}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "session_id"
  range_key    = "timestamp"
  
  attribute {
    name = "session_id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "S"
  }
  
  # Time to Live (TTL) for automatic cleanup
  ttl {
    attribute_name = "expiration_time"
    enabled        = true
  }
  
  # Point-in-time recovery for backup and restore
  point_in_time_recovery {
    enabled = true
  }
  
  # Server-side encryption with AWS KMS
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.encryption_key.arn
  }
  
  tags = local.tags
}

# DynamoDB table for tracking processing status
resource "aws_dynamodb_table" "processing_status" {
  name         = "${local.name_prefix}-processing-status"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "session_id"
  
  attribute {
    name = "session_id"
    type = "S"
  }
  
  # Time to Live (TTL) for automatic cleanup
  ttl {
    attribute_name = "expiration_time"
    enabled        = true
  }
  
  # Point-in-time recovery for backup and restore
  point_in_time_recovery {
    enabled = true
  }
  
  # Server-side encryption with AWS KMS
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.encryption_key.arn
  }
  
  tags = local.tags
}

# DynamoDB Global Secondary Index for status queries
resource "aws_dynamodb_table_global_secondary_index" "status_index" {
  name               = "status-index"
  hash_key           = "status"
  range_key          = "timestamp"
  table_name         = aws_dynamodb_table.processing_status.name
  projection_type    = "ALL"
}

# CloudWatch alarms for DynamoDB throttling
resource "aws_cloudwatch_metric_alarm" "dynamodb_read_throttle" {
  alarm_name          = "${local.name_prefix}-dynamodb-read-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "ReadThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "DynamoDB read throttle events exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    TableName = aws_dynamodb_table.results_table.name
  }
  
  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_write_throttle" {
  alarm_name          = "${local.name_prefix}-dynamodb-write-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "DynamoDB write throttle events exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    TableName = aws_dynamodb_table.results_table.name
  }
  
  tags = local.tags
}

# SNS Topic for alarms
resource "aws_sns_topic" "alarms" {
  name = "${local.name_prefix}-alarms"
  
  kms_master_key_id = aws_kms_key.encryption_key.id
  
  tags = local.tags
}
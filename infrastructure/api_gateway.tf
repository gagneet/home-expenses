# infrastructure/api_gateway.tf
# API Gateway v2 (HTTP API)
resource "aws_apigatewayv2_api" "api_gateway" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins     = var.cors_allowed_origins
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers     = ["Content-Type", "Authorization"]
    expose_headers    = ["Content-Type", "Authorization"]
    allow_credentials = true
    max_age           = 300
  }
  
  tags = local.tags
}

# API Gateway stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api_gateway.id
  name        = "$default"
  auto_deploy = true
  
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      integrationLatency = "$context.integrationLatency"
      responseLatency = "$context.responseLatency"
    })
  }
  
  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }
  
  tags = local.tags
}

# API Gateway integration with Lambda
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.process_statements.invoke_arn
  integration_method = "POST"
  
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000  # 30 seconds
}

# API Gateway routes
resource "aws_apigatewayv2_route" "upload_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /api/v1/upload"
  
  target = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "status_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "GET /api/v1/status/{sessionId}"
  
  target = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "delete_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "DELETE /api/v1/session/{sessionId}"
  
  target = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "health_route" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "GET /api/v1/health"
  
  target = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# API Gateway logs
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${aws_apigatewayv2_api.api_gateway.name}"
  retention_in_days = var.log_retention_days
  
  tags = local.tags
}

# API Key for authentication (if enabled)
resource "aws_apigatewayv2_api_key" "api_key" {
  count = var.enable_api_auth ? 1 : 0
  
  name = "${local.name_prefix}-api-key"
  
  tags = local.tags
}

# WAF Web ACL for API Gateway
resource "aws_wafv2_web_acl" "api_waf" {
  count = var.enable_waf ? 1 : 0
  
  name        = "${local.name_prefix}-api-waf"
  description = "WAF Web ACL for ${local.name_prefix} API"
  scope       = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  # AWS Managed Rule Groups
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-common-rule-set"
      sampled_requests_enabled   = true
    }
  }
  
  # SQL Injection Protection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 20
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-sqli-rule-set"
      sampled_requests_enabled   = true
    }
  }
  
  # Rate-based rule to prevent DDoS
  rule {
    name     = "RateLimitRule"
    priority = 30
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-waf-acl"
    sampled_requests_enabled   = true
  }
  
  tags = local.tags
}

# Associate WAF Web ACL with API Gateway
resource "aws_wafv2_web_acl_association" "api_waf_association" {
  count = var.enable_waf ? 1 : 0
  
  resource_arn = aws_apigatewayv2_stage.default.arn
  web_acl_arn  = aws_wafv2_web_acl.api_waf[0].arn
}
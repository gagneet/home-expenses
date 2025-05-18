# infrastructure/s3.tf
# S3 bucket for frontend static website hosting
resource "aws_s3_bucket" "frontend" {
  bucket = "${local.name_prefix}-frontend"
  
  tags = local.tags
}

# Block public access to frontend bucket (access via CloudFront only)
resource "aws_s3_bucket_public_access_block" "frontend_block_public" {
  bucket = aws_s3_bucket.frontend.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning for frontend bucket
resource "aws_s3_bucket_versioning" "frontend_versioning" {
  bucket = aws_s3_bucket.frontend.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Frontend bucket policy allowing CloudFront access
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "s3:GetObject"
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend_oai.iam_arn
        }
      }
    ]
  })
}

# S3 bucket for statement storage
resource "aws_s3_bucket" "statements" {
  bucket = "${local.name_prefix}-statements"
  
  tags = local.tags
}

# Block public access to statements bucket
resource "aws_s3_bucket_public_access_block" "statements_block_public" {
  bucket = aws_s3_bucket.statements.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable server-side encryption for statements bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "statements_encryption" {
  bucket = aws_s3_bucket.statements.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Configure lifecycle policy for statement files
resource "aws_s3_bucket_lifecycle_configuration" "statements_lifecycle" {
  bucket = aws_s3_bucket.statements.id
  
  rule {
    id     = "delete-after-processing"
    status = "Enabled"
    
    expiration {
      days = 1
    }
  }
}

# S3 bucket for processing results
resource "aws_s3_bucket" "results" {
  bucket = "${local.name_prefix}-results"
  
  tags = local.tags
}

# Block public access to results bucket
resource "aws_s3_bucket_public_access_block" "results_block_public" {
  bucket = aws_s3_bucket.results.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable server-side encryption for results bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "results_encryption" {
  bucket = aws_s3_bucket.results.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Configure lifecycle policy for result files
resource "aws_s3_bucket_lifecycle_configuration" "results_lifecycle" {
  bucket = aws_s3_bucket.results.id
  
  rule {
    id     = "expire-old-results"
    status = "Enabled"
    
    expiration {
      days = var.result_ttl_days
    }
  }
}

# CloudFront origin access identity for frontend bucket
resource "aws_cloudfront_origin_access_identity" "frontend_oai" {
  comment = "OAI for ${local.name_prefix} frontend"
}

# CloudFront distribution for frontend
resource "aws_cloudfront_distribution" "frontend_distribution" {
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend.bucket}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend_oai.cloudfront_access_identity_path
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = var.cloudfront_price_class
  
  # Custom error response for SPA routing
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }
  
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.bucket}"
    
    forwarded_values {
      query_string = false
      
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = local.tags
}
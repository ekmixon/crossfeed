resource "aws_s3_bucket" "frontend_bucket" {
  bucket = var.frontend_bucket
  acl    = "private"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  versioning {
    enabled    = true
    mfa_delete = true
  }

  logging {
    target_bucket = aws_s3_bucket.logging_bucket.id
    target_prefix = "frontend_bucket/"
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }
}

data "template_file" "policy_file" {
  template = file("frontend_bucket_policy.tpl")
  vars = {
    bucket_name = var.frontend_bucket
  }
}

resource "aws_s3_bucket_policy" "b" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = data.template_file.policy_file.rendered
}

locals {
  s3_origin_id = "myS3Origin"
}

data "archive_file" "security_headers" {
  type        = "zip"
  source_dir  = "lambdas/security_headers"
  output_path = "lambdas/security_headers.zip"
}

resource "aws_lambda_function" "security_headers" {
  filename      = "lambdas/security_headers.zip"
  function_name = var.frontend_lambda_function
  role          = aws_iam_role.frontend_lambda_iam.arn
  handler       = "index.handler"
  runtime       = "nodejs12.x"
  publish       = true
  tracing_config {
    mode = "Active"
  }
}

resource "aws_iam_role" "frontend_lambda_iam" {
  name               = "frontend_lambda_iam_${var.stage}"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": [
          "lambda.amazonaws.com",
          "edgelambda.amazonaws.com"
        ]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = local.s3_origin_id
  }

  aliases = [var.frontend_domain]

  enabled             = true
  is_ipv6_enabled     = true
  comment             = var.cloudfront_name
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    lambda_function_association {
      event_type   = "origin-response"
      include_body = false
      lambda_arn   = aws_lambda_function.security_headers.qualified_arn
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logging_bucket.id
    prefix          = "frontend_cloudfront/"
  }

  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    lambda_function_association {
      event_type   = "origin-response"
      include_body = false
      lambda_arn   = aws_lambda_function.security_headers.qualified_arn
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 2628000
    max_ttl                = 2628000
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  viewer_certificate {
    acm_certificate_arn      = var.frontend_cert_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }

  web_acl_id = aws_wafv2_web_acl.default.id
}

resource "aws_wafv2_web_acl" "default" {
  name  = "crossfeed-${var.stage}-default-acl-rule"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  tags = {
    Project = var.project
    Stage   = var.stage
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "crossfeed-${var.stage}-default-acl-metric"
    sampled_requests_enabled   = true
  }
}
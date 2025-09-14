# terraform/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
  
  backend "s3" {
    bucket = "financial-analyzer-terraform-state"
    key    = "state/terraform.tfstate"
    region = "ap-southeast-2"  # Sydney region for Australia
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  environment     = var.environment
  vpc_cidr        = var.vpc_cidr
  azs             = var.availability_zones
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
}

# Security
module "security" {
  source = "./modules/security"
  
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"
  
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  public_subnet_ids   = module.vpc.public_subnet_ids
  security_group_ids  = [module.security.ecs_security_group_id]
  
  app_name            = var.app_name
  frontend_image      = var.frontend_image
  backend_image       = var.backend_image
  frontend_port       = var.frontend_port
  backend_port        = var.backend_port
  
  # IAM roles
  ecs_task_execution_role_arn = module.security.ecs_task_execution_role_arn
  ecs_task_role_arn           = module.security.ecs_task_role_arn
  
  # Environment variables for containers
  frontend_environment = var.frontend_environment
  backend_environment  = var.backend_environment
}

# MongoDB DocumentDB
module "documentdb" {
  source = "./modules/documentdb"
  
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  security_group_ids  = [module.security.documentdb_security_group_id]
  
  cluster_name        = "${var.app_name}-documentdb"
  master_username     = var.documentdb_username
  master_password     = var.documentdb_password
}

# S3 for Statement Storage
module "s3" {
  source = "./modules/s3"
  
  environment     = var.environment
  app_name        = var.app_name
  statements_bucket_name = "${var.app_name}-statements-${var.environment}"
}

# CloudFront Distribution for Frontend
module "cloudfront" {
  source = "./modules/cloudfront"
  
  environment     = var.environment
  app_name        = var.app_name
  alb_domain_name = module.ecs.alb_domain_name
}

# Route53 DNS Records
module "route53" {
  source = "./modules/route53"
  
  environment       = var.environment
  app_name          = var.app_name
  domain_name       = var.domain_name
  cloudfront_domain = module.cloudfront.cloudfront_domain_name
  alb_domain_name   = module.ecs.alb_domain_name
}

# Outputs
output "frontend_url" {
  value = module.route53.frontend_domain
}

output "backend_url" {
  value = module.route53.api_domain
}

output "documentdb_endpoint" {
  value = module.documentdb.cluster_endpoint
}

output "statements_bucket_name" {
  value = module.s3.statements_bucket_name
}
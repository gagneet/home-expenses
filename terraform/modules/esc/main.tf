# terraform/modules/ecs/main.tf
# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster-${var.environment}"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# Load Balancer
resource "aws_lb" "main" {
  name               = "${var.app_name}-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = var.security_group_ids
  subnets            = var.public_subnet_ids
  
  enable_deletion_protection = false
  
  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

resource "aws_lb_target_group" "frontend" {
  name        = "${var.app_name}-frontend-tg-${var.environment}"
  port        = var.frontend_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  
  health_check {
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    port                = "traffic-port"
  }
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.app_name}-backend-tg-${var.environment}"
  port        = var.backend_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  
  health_check {
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    port                = "traffic-port"
  }
}

resource "aws_lb_listener" "frontend" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.frontend.arn
  
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
  
  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# Frontend Service
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.app_name}-frontend-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn
  
  container_definitions = jsonencode([{
    name      = "${var.app_name}-frontend"
    image     = var.frontend_image
    essential = true
    
    portMappings = [{
      containerPort = var.frontend_port
      hostPort      = var.frontend_port
      protocol      = "tcp"
    }]
    
    environment = [
      for key, value in var.frontend_environment : {
        name  = key
        value = value
      }
    ]
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.app_name}-frontend-${var.environment}"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "frontend" {
  name            = "${var.app_name}-frontend-service-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "${var.app_name}-frontend"
    container_port   = var.frontend_port
  }
  
  depends_on = [aws_lb_listener.frontend]
}

# Backend Service
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.app_name}-backend-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn
  
  container_definitions = jsonencode([{
    name      = "${var.app_name}-backend"
    image     = var.backend_image
    essential = true
    
    portMappings = [{
      containerPort = var.backend_port
      hostPort      = var.backend_port
      protocol      = "tcp"
    }]
    
    environment = [
      for key, value in var.backend_environment : {
        name  = key
        value = value
      }
    ]
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.app_name}-backend-${var.environment}"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
  
  # Mount volume for uploaded files
  volume {
    name = "statements-data"
    
    efs_volume_configuration {
      file_system_id = aws_efs_file_system.statements.id
      root_directory = "/"
    }
  }
}

resource "aws_ecs_service" "backend" {
  name            = "${var.app_name}-backend-service-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "${var.app_name}-backend"
    container_port   = var.backend_port
  }
  
  depends_on = [aws_lb_listener.frontend]
}

# EFS for statement storage
resource "aws_efs_file_system" "statements" {
  creation_token = "${var.app_name}-statements-${var.environment}"
  
  tags = {
    Name        = "${var.app_name}-statements-efs-${var.environment}"
    Environment = var.environment
    Application = var.app_name
  }
}

resource "aws_efs_mount_target" "statements" {
  count           = length(var.private_subnet_ids)
  file_system_id  = aws_efs_file_system.statements.id
  subnet_id       = var.private_subnet_ids[count.index]
  security_groups = var.security_group_ids
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.app_name}-frontend-${var.environment}"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.app_name}-backend-${var.environment}"
  retention_in_days = 30
}
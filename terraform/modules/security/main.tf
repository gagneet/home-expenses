# terraform/modules/security/main.tf (continued)
# Outputs
output "ecs_security_group_id" {
  value = aws_security_group.ecs_tasks.id
}

output "documentdb_security_group_id" {
  value = aws_security_group.documentdb.id
}

output "efs_security_group_id" {
  value = aws_security_group.efs.id
}

output "alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "ecs_task_execution_role_arn" {
  value = aws_iam_role.ecs_task_execution_role.arn
}

output "ecs_task_role_arn" {
  value = aws_iam_role.ecs_task_role.arn
}
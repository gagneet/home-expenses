# Financial Statement Analyzer - Setup Guide

This guide will help you set up and run the Financial Statement Analyzer application locally using Docker, then deploy it to AWS using Terraform.

## Prerequisites

- [Node.js](https://nodejs.org/) v16 or later
- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [Terraform](https://www.terraform.io/downloads.html) v1.0 or later
- Git

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/financial-statement-analyzer.git
cd financial-statement-analyzer
```

### 2. Set Up Environment Variables

Create `.env` files for both frontend and backend:

```bash
# In the project root
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Update the environment variables in both files with your settings.

### 3. Start with Docker Compose

Launch the application using Docker Compose:

```bash
docker-compose -f docker/docker-compose.yml up --build
```

This will start:
- React frontend on http://localhost:3000
- Node.js backend API on http://localhost:4000
- MongoDB database

### 4. Access the Application

Open your browser and navigate to:
- Frontend: http://localhost:3000
- API: http://localhost:4000/api

## AWS Deployment

### 1. Set Up AWS Infrastructure with Terraform

Initialize Terraform:

```bash
cd terraform
terraform init
```

Create a `terraform.tfvars` file with your specific variables:

```hcl
aws_region = "ap-southeast-2"  # Sydney region
environment = "dev"
app_name = "financial-analyzer"
domain_name = "yourdomainname.com"  # Optional

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
availability_zones = ["ap-southeast-2a", "ap-southeast-2b"]
private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]

# Container images (ECR repositories or Docker Hub)
frontend_image = "youraccountid.dkr.ecr.ap-southeast-2.amazonaws.com/financial-analyzer-frontend:latest"
backend_image = "youraccountid.dkr.ecr.ap-southeast-2.amazonaws.com/financial-analyzer-backend:latest"

# DocumentDB
documentdb_username = "admin"
documentdb_password = "YourSecurePassword123!"

# Frontend environment variables
frontend_environment = {
  "REACT_APP_API_URL" = "https://api.yourdomainname.com"
}

# Backend environment variables
backend_environment = {
  "NODE_ENV" = "production"
  "PORT" = "4000"
  "MONGO_URI" = "mongodb://admin:YourSecurePassword123!@docdb-endpoint:27017/financial-analyzer?replicaSet=rs0&ssl=true"
  "JWT_SECRET" = "your-jwt-secret-here"
  "CORS_ORIGIN" = "https://yourdomainname.com"
}
```

Plan the infrastructure:

```bash
terraform plan -out=tfplan
```

Apply the configuration:

```bash
terraform apply tfplan
```

### 2. Build and Push Docker Images

Build and tag Docker images:

```bash
# Log in to ECR
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin youraccountid.dkr.ecr.ap-southeast-2.amazonaws.com

# Build images
docker build -t youraccountid.dkr.ecr.ap-southeast-2.amazonaws.com/financial-analyzer-frontend:latest -f docker/frontend/Dockerfile.prod frontend
docker build -t youraccountid.dkr.ecr.ap-southeast-2.amazonaws.com/financial-analyzer-backend:latest -f docker/backend/Dockerfile.prod backend

# Push images
docker push youraccountid.dkr.ecr.ap-southeast-2.amazonaws.com/financial-analyzer-frontend:latest
docker push youraccountid.dkr.ecr.ap-southeast-2.amazonaws.com/financial-analyzer-backend:latest
```

### 3. Update ECS Services

Update the ECS services to use the new images:

```bash
aws ecs update-service --cluster financial-analyzer-cluster-dev --service financial-analyzer-frontend-service-dev --force-new-deployment
aws ecs update-service --cluster financial-analyzer-cluster-dev --service financial-analyzer-backend-service-dev --force-new-deployment
```

### 4. Access the Deployed Application

After deployment completes (which may take a few minutes), you can access your application at:
- Frontend: https://yourdomainname.com or the ALB DNS name from Terraform output
- API: https://api.yourdomainname.com

## DevSecOps Integration

### Set Up CI/CD Pipeline with GitHub Actions

Create a GitHub Actions workflow file at `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci
          
      - name: Run linters
        run: |
          cd frontend && npm run lint
          cd ../backend && npm run lint
          
      - name: Run tests
        run: |
          cd frontend && npm test
          cd ../backend && npm test
          
      - name: Run security scan
        uses: snyk/actions/node@master
        with:
          args: --all-projects
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  build-and-deploy:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-2
          
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
        
      - name: Build and push frontend image
        uses: docker/build-push-action@v3
        with:
          context: ./frontend
          file: ./docker/frontend/Dockerfile.prod
          push: true
          tags: ${{ steps.login-ecr.outputs.registry }}/financial-analyzer-frontend:latest
          
      - name: Build and push backend image
        uses: docker/build-push-action@v3
        with:
          context: ./backend
          file: ./docker/backend/Dockerfile.prod
          push: true
          tags: ${{ steps.login-ecr.outputs.registry }}/financial-analyzer-backend:latest
          
      - name: Update ECS services
        run: |
          aws ecs update-service --cluster financial-analyzer-cluster-dev --service financial-analyzer-frontend-service-dev --force-new-deployment
          aws ecs update-service --cluster financial-analyzer-cluster-dev --service financial-analyzer-backend-service-dev --force-new-deployment
```

### Security Best Practices

1. **Secrets Management**:
   - Use AWS Secrets Manager for database credentials and API keys
   - Never hardcode secrets in your codebase
   - Use GitHub Secrets for CI/CD pipeline credentials

2. **Code Security**:
   - Run regular dependency vulnerability scans with tools like Snyk or OWASP Dependency Check
   - Implement code reviews for all PRs
   - Use ESLint with security plugins

3. **Infrastructure Security**:
   - Use Security Groups to limit access between components
   - Implement WAF rules to protect against common attacks
   - Enable logging and monitoring for all AWS resources
   - Use IAM roles with least privilege principle

4. **Application Security**:
   - Implement proper authentication and authorization
   - Validate and sanitize all user inputs
   - Use HTTPS for all communication
   - Implement rate limiting on API endpoints
   - Regular security testing (SAST, DAST)

## Troubleshooting

### Common Issues

1. **Docker Compose Connection Issues**
   - Ensure all services in docker-compose are on the same network
   - Check the environment variables for correct service names

2. **MongoDB Connection Issues**
   - Verify MongoDB connection string in environment variables
   - Check MongoDB container logs for startup issues
   
3. **AWS Deployment Issues**
   - Check CloudWatch Logs for application errors
   - Verify security group rules allow necessary traffic
   - Check ECS task definitions for correct environment variables

For more help, check the detailed logs or open an issue on the project repository.
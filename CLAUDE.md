# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Financial Statement Analyzer application designed for Australian personal finance management, with features similar to Microsoft Money. The project processes bank statements and categorizes transactions for financial analysis.

## Architecture

**Full-Stack Application**:
- **Frontend**: React with TypeScript, using Tailwind CSS for styling
- **Backend**: Node.js/Express API with TypeScript
- **Database**: PostgreSQL with comprehensive Australian finance schema
- **Containerization**: Docker and Docker Compose for development
- **Infrastructure**: Terraform modules for AWS deployment

**Key Components**:
- File upload and parsing system for PDF/CSV bank statements
- Transaction categorization engine with rules-based matching
- Dashboard with charts and financial summaries
- Authentication system with JWT tokens
- Investment tracking including ASX stocks and superannuation

## Development Commands

### Frontend (React/TypeScript)
```bash
cd frontend
npm start          # Start development server on port 3000
npm run build      # Create production build
npm test           # Run tests
```

### Backend (Node.js/Express)
```bash
cd backend
npm run dev        # Start development server with hot reload on port 4000
npm run build      # Compile TypeScript to dist/
npm start          # Start production server from dist/
```

### Docker Development
```bash
# Start full stack with Docker Compose
docker-compose -f docker/docker-compose-dev.yml up --build

# Production build
docker-compose -f docker/docker-compose.yml up --build
```

## Database

The project uses a comprehensive PostgreSQL schema (`schema.sql`) designed for Australian finance management including:
- Multi-account support (banking, investment, superannuation)
- Australian-specific features (BSB numbers, BPAY, franking credits)
- Transaction categorization and tax reporting
- Investment holdings and ASX stock tracking
- Budgeting and financial goals

## Key File Structure

```
├── frontend/src/
│   ├── components/
│   │   ├── auth/           # Login/Register components
│   │   ├── dashboard/      # Dashboard, charts, summaries
│   │   └── upload/         # File upload components
│   ├── services/api.ts     # API client
│   └── types/              # TypeScript type definitions
├── backend/src/
│   ├── api/                # Express routes (auth, upload)
│   ├── services/           # Business logic (categorizer, parsers)
│   ├── models/             # Data models
│   ├── middleware/         # Authentication middleware
│   └── types/              # TypeScript interfaces
├── docker/                 # Docker configurations
├── terraform/              # AWS infrastructure as code
└── schema.sql             # Complete PostgreSQL database schema
```

## Development Workflow

1. **Local Development**: Use `npm run dev` in both frontend and backend directories
2. **Docker Development**: Use `docker-compose-dev.yml` for full stack development
3. **Database**: The schema.sql contains the complete database structure
4. **Authentication**: JWT-based authentication with token storage
5. **File Processing**: Supports PDF and CSV bank statement uploads

## Important Notes

- Frontend runs on port 3000, backend on port 4000
- MongoDB is referenced in Docker Compose but the schema is PostgreSQL
- The application includes both simplified MVP components and full-featured versions
- Transaction categorization uses both rule-based and ML approaches
- Australian banking specifics are built into the data models (BSB, BPAY, etc.)
- Investment tracking supports ASX securities and superannuation accounts

## Testing

Frontend uses React Testing Library and Jest (configured in package.json). Backend testing structure is in place but specific test commands should be verified in package.json.

## AWS Deployment

Terraform configurations are available in the `terraform/` directory with modules for security, ECS, and other AWS services. The infrastructure follows DevSecOps best practices with comprehensive security controls.
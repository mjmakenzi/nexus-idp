# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Identity Provider (IDP) system built with NestJS, implementing a monorepo architecture. The project consists of two main applications (`api` and `admin`) and several shared libraries.

## Architecture

### Applications
- **API** (`apps/api/`): Main API server using Fastify adapter, serves on configured port with `/api` prefix
- **Admin** (`apps/admin/`): Admin interface application

### Libraries
- **auth** (`libs/auth/`): Authentication services including JWT, OTP, sessions, and federated auth
- **db** (`libs/db/`): Database layer using MikroORM with PostgreSQL, includes entities and repositories
- **devices** (`libs/devices/`): Device management functionality
- **security** (`libs/security/`): Security features including audit logs, rate limiting, and security events
- **shared-utils** (`libs/shared-utils/`): Shared utilities and services (JWT, email, SMS, captcha, etc.)
- **user** (`libs/user/`): User and profile management

### Key Technologies
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with MikroORM
- **Authentication**: JWT with Passport.js
- **API Documentation**: Swagger (available at `/docs` in non-production)
- **Logging**: Pino
- **Validation**: class-validator and Joi

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start API in development mode
npm run start:dev

# Start Admin in development mode
npm run start:dev:admin

# Start in debug mode
npm run start:debug
```

### Building
```bash
# Build the project
npm run build

# Start in production mode
npm run start:prod
```

### Testing
```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run test coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Debug tests
npm run test:debug
```

### Code Quality
```bash
# Run linter
npm run lint

# Format code
npm run format
```

### Database Migrations
```bash
# Create a new migration
npm run migration:create

# Run migrations
npm run migration:up

# Rollback migrations
npm run migration:down

# Check migration status
npm run migration:check
```

## Configuration

The project uses environment variables for configuration. Copy `env.sample` to `.env` and configure:
- Database connection (DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASS, DATABASE_NAME)
- JWT secrets and configuration
- External service credentials (Apple Sign-In, Kavenegar SMS, Nodemailer, etc.)
- reCAPTCHA configuration

## Module Dependencies

Each library module exports its functionality through an index.ts file. Import paths are configured in tsconfig.json:
- `@app/auth` - Authentication module
- `@app/db` - Database module
- `@app/devices` - Device management
- `@app/security` - Security features
- `@app/shared-utils` - Shared utilities
- `@app/user` - User management

## Development Tips

1. The project uses strict TypeScript configuration - ensure all types are properly defined
2. Global validation pipes are configured with whitelist and transform options
3. API responses follow NestJS patterns with proper DTOs
4. Database entities use MikroORM decorators and extend from base repositories
5. Authentication uses JWT strategy with access and refresh tokens
6. All sensitive operations should be logged through the audit log service
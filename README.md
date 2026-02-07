<p align="center">
  <strong>Nexus IDP</strong> — Identity Provider
</p>

<p align="center">
  <strong>Production-ready auth, sessions & device management</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Fastify-4-000000?style=flat-square&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />
</p>

<p align="center">
  A modular <strong>Identity Provider (IDP)</strong> built with NestJS and TypeScript.  
  Phone/email OTP login, JWT sessions, device tracking, session limits & archiving, and an admin API for operations and audit.
</p>

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [API reference](#api-reference)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

Nexus IDP is a **monorepo Identity Provider** that can serve as a standalone auth backend or the identity layer for multiple apps. It includes:

- **API app** — REST API with phone/email OTP login, JWT (access + refresh), profile, and Swagger docs.
- **Admin app** — Session health, cleanup, archives, and device trust management.
- **Shared libs** — Auth, user/profile, DB (MikroORM + PostgreSQL), devices, security (audit, rate limit), and shared utilities (JWT, OTP, email, SMS, session, etc.).

Session security is built-in: configurable session limits per user, automatic termination of oldest sessions, archiving for audit, and device–session correlation.

---

## Features

| Area | Capabilities |
|------|--------------|
| **Auth** | Phone OTP (SMS via Kavenegar), email OTP (Nodemailer), JWT access + refresh, logout with token revocation |
| **Sessions** | Per-user/device limits, auto-terminate oldest, archiving, termination reasons (logout, timeout, revoked, device_removed, session_limit_enforced) |
| **Devices** | Registration, user-agent/IP/OS/browser tracking, device–session link, trust/untrust (admin) |
| **Security** | Rate limiting (e.g. OTP), security events, audit logs, revoked-token store, Pino logging |
| **User & profile** | User (email, phone, status, roles), profile with avatar (MinIO, optional imgproxy), account management |
| **Admin API** | Session health & cleanup, terminate by user/device, archive stats/list/retention/restore/cleanup, device trust status & list |

---

## Architecture

Monorepo with two applications and six shared libraries:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Nexus IDP Monorepo                               │
├──────────────────────────────┬──────────────────────────────────────────┤
│  apps/api (Fastify)          │  apps/admin                              │
│  /api • Swagger @ /docs       │  Sessions • Archives • Device trust      │
├──────────────────────────────┴──────────────────────────────────────────┤
│  libs/auth    libs/user    libs/db    libs/devices    libs/security       │
│  libs/shared-utils (JWT, OTP, session, email, SMS, captcha, avatar…)    │
└─────────────────────────────────────────────────────────────────────────┘
```

| App | Purpose |
|-----|--------|
| **api** | Main API: auth (`/api/account`), profile (`/api/profile`), global prefix `/api`, Swagger in non-production |
| **admin** | Admin API: session health/cleanup/termination, archives, device trust (separate port) |

| Library | Responsibility |
|---------|----------------|
| **auth** | OTP send/verify, login, refresh, logout, session limits |
| **user** | User, profile, account management |
| **db** | MikroORM, PostgreSQL entities, repositories, migrations |
| **devices** | Device CRUD and trust |
| **security** | Audit log, rate limit, security events |
| **shared-utils** | JWT, OTP, session, email, SMS (Kavenegar), captcha (Arcaptcha), Apple, Discourse, avatar, device detection, revoked tokens, logger |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Framework | NestJS 11 |
| HTTP | Fastify |
| Language | TypeScript (strict) |
| Database | PostgreSQL |
| ORM | MikroORM 6 |
| Auth | JWT (Passport), bcrypt |
| Validation | class-validator, Joi |
| API docs | Swagger (OpenAPI) |
| Logging | Pino |
| SMS | Kavenegar |
| Email | Nodemailer |
| Storage | MinIO (avatars), optional imgproxy |

---

## Getting started

### Prerequisites

- **Node.js** 18+
- **PostgreSQL**
- **npm** (or yarn/pnpm)

Optional: Redis, MinIO, Kavenegar API key, SMTP, Arcaptcha, Apple Sign-In (see `.env.sample`).

### Install & run

```bash
# Clone and install
git clone git@github.com:mjmakenzi/nexus-idp.git
cd nexus-idp
npm install

# Environment (required: DATABASE_*, JWT_SECRET, JWT_REFRESH_SECRET)
cp .env.sample .env
# Edit .env as needed

# Database
npm run migration:up

# Run API (port 4000) and Admin (port 4001)
npm run start:dev
npm run start:dev:admin   # in another terminal
```

| URL | Description |
|-----|-------------|
| `http://localhost:4000/api` | API base |
| `http://localhost:4000/docs` | Swagger (non-production) |
| `http://localhost:4001` | Admin API base |

---

## API reference

### Auth — `/api/account`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `v1/send-otp-phone` | Send SMS OTP |
| POST | `v1/one-click-phone` | Login with phone OTP |
| POST | `v1/send-otp-email` | Send email OTP |
| POST | `v1/one-click-email` | Login with email OTP |
| POST | `v1/refresh-token` | Refresh JWT (body: refresh token) |
| POST | `v1/logout` | Logout (body: refresh token) |

### Profile — `/api/profile` (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `v1/me` | Current user profile |

### Admin — sessions & devices (admin app)

| Method | Endpoint (examples) | Description |
|--------|---------------------|-------------|
| GET | `sessions/health` | Session health stats |
| POST | `sessions/cleanup` | Manual session cleanup |
| POST | `sessions/terminate-user` | Terminate all sessions for a user |
| GET | `sessions/archives/stats` | Archive statistics |
| GET | `sessions/archives/with-details` | List archives with filters |
| POST | `sessions/archives/cleanup` | Archive terminated sessions |
| POST | `devices/trust` / `devices/untrust` | Trust/untrust device |
| GET | `devices/trusted/:userId` | List trusted devices |

Full request/response schemas: use **Swagger** at `/docs` when running the API in non-production.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | API in watch mode |
| `npm run start:dev:admin` | Admin in watch mode |
| `npm run build` | Build project |
| `npm run start:prod` | Run built API |
| `npm run test` | Unit tests |
| `npm run test:cov` | Coverage |
| `npm run test:e2e` | E2E tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run migration:create` | Create migration |
| `npm run migration:up` | Run migrations |
| `npm run migration:down` | Rollback migrations |

---

## Project structure

```
nexus-idp/
├── apps/
│   ├── api/              # Main API (auth + profile)
│   └── admin/            # Admin API (sessions, devices)
├── libs/
│   ├── auth/             # Auth controller & service
│   ├── user/             # User, profile, account management
│   ├── db/               # Entities, repositories, migrations
│   ├── devices/          # Device service
│   ├── security/         # Audit, rate limit, security events
│   └── shared-utils/     # JWT, OTP, session, email, SMS, etc.
├── docs/
│   └── SESSION_SECURITY.md
├── .env.sample
└── package.json
```

---

## Documentation

- **[Session security](docs/SESSION_SECURITY.md)** — Session limits, lifecycle, termination reasons, configuration.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>M. Mahdian</strong> · Sample Identity Provider for portfolio & integration use
</p>

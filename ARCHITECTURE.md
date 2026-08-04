# RentItEase Architecture

## Overview

RentItEase is organized as a monorepo with separate application layers for mobile, backend, admin, and shared infrastructure.

## High-level Structure

- Mobile application: Flutter client for tenants, owners, and visitors
- Backend API: Node.js/Express service with TypeScript
- Admin panel: React dashboard for operations and moderation
- Database layer: PostgreSQL for core data and Redis for caching/session support
- Infrastructure: Docker-based local development and deployment assets

## Architectural Principles

- Clear separation between presentation, application, domain, and data layers
- APIs communicate through well-defined contracts
- Shared business rules stay central and reusable
- Services are independently deployable where reasonable
- Observability and security are built in from the start

## Runtime Flow

1. Users interact with the Flutter app or web admin panel.
2. Requests are routed to the backend API through authenticated endpoints.
3. The backend validates input, applies domain rules, and persists data.
4. PostgreSQL stores primary business entities while Redis supports caching and queues.
5. Notifications, media, and payments are integrated through external services.

## Recommended Development Boundaries

- Mobile app should depend only on domain contracts and API adapters.
- Backend should own authentication, business rules, and persistence.
- Admin panel should consume the API and keep UI concerns separate.
- Shared schemas and models should be maintained centrally.

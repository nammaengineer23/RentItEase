# Database Design

## Overview

RentItEase uses PostgreSQL as the primary relational database and Redis for caching and supporting services.

## Core Entities

- Users
- Properties
- Bookings
- Payments
- Chats
- Reviews
- Admin actions

## Guidelines

- Keep schemas versioned and documented.
- Use migrations for schema changes.
- Design indexes around common query patterns.

# RentItEase Release Testing Workflow

1. Backend build
2. Authentication E2E
3. Tenant E2E
4. Owner E2E
5. Booking E2E
6. Payment E2E
7. Lease E2E
8. Invoice E2E
9. Membership E2E
10. Premium Listing E2E
11. Chat E2E
12. Push Notification E2E
13. Admin E2E
14. Security/configuration audit
15. Full regression
16. Flutter tenant/owner integration smoke
17. Flutter Web build
18. Android release build
19. Release Candidate 1 gate

The GitHub Actions workflow runs the backend build and remote release E2E first,
then Flutter analyze/test/web/android builds. A failing lease implementation,
security scan, backend build, E2E, web build, or Android build blocks RC1.

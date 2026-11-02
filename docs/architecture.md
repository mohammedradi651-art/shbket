# Architecture decisions

## Core boundaries

```text
Browser -> Web app -> HTTPS API -> Auth/Repository -> Firestore
                                      |
                                      +-> MikroTikService (future adapters)
```

The browser never receives Firebase Admin credentials and never chooses an authoritative `networkId`. The API derives tenant context from the authenticated session and checks role plus network membership on every protected operation.

## Firestore collections

- `users/{userId}`: identity profile, role, `networkId`, status.
- `networks/{networkId}`: owner, branding, status, plan, timestamps.
- `customers/{customerId}`: `networkId`, phone, profile and account status.
- `packages/{packageId}`: `networkId`, GB, price, validity days, active state.
- `subscriptions/{subscriptionId}`: immutable purchase references, validity and remaining bytes.
- `resellers/{resellerId}`: `networkId`, permissions, status.
- `transactions/{transactionId}`: append-only top-up ledger with before/after snapshots.
- `mikrotiks/{mikrotikId}`: `networkId`, adapter type, encrypted connection reference, status.
- `accountingEvents/{eventId}`: `networkId`, source, raw event reference, idempotency key.
- `auditLogs/{logId}`: `networkId`, actor, action, resource, timestamp.

For scale, transactional queries are scoped by `networkId` and indexed with the operational field, for example `(networkId, createdAt)` and `(networkId, phone)`.

## API surface

- `POST /api/auth/owner/request-otp`: send a real four-digit owner OTP.
- `POST /api/auth/owner/verify-otp`: create the owner and network after verification.
- `POST /api/auth/owner/login/request-otp`: send a login OTP.
- `POST /api/auth/owner/login/verify-otp`: issue a signed session after verification.
- `GET /api/auth/me`: resolve current session.
- `GET /api/networks/current`: current tenant profile.
- `GET /api/dashboard/summary`: tenant-scoped metrics.
- Future: `/api/otp`, `/api/customers`, `/api/packages`, `/api/resellers`, `/api/transactions`, `/api/accounting`, `/api/mikrotiks`.

## Roles

- `super_admin`: cross-tenant support and operations, audited.
- `network_owner`: full control within their network.
- `reseller`: customer lookup and append-only top-ups within their network.

## MikroTik boundary

Business services call `MikroTikService`, not RouterOS details. The service will expose operations such as `authorizeSession`, `disconnectSession`, `getAccounting`, and `healthCheck`. Adapters can later implement RouterOS API, RADIUS, or an accounting webhook without changing customer, subscription, or dashboard modules.

## Phase one non-goals

Owner OTP, Firestore persistence, signed sessions, and the tenant-scoped dashboard are active. Customer onboarding, device trust, package purchase, RADIUS authorization, and live accounting still require their external provider or MikroTik configuration before they can be activated honestly.

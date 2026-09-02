# Security & RBAC Red-Team Findings

## 1. Vulnerability Assessment Summary
- **Critical (P0):** 0
- **High (P1):** 1 (Header-based tenant trust model without JWT session claim validation)
- **Medium (P2):** 2 (Missing database-backed rate limiting, In-memory audit logs)
- **Low (P3):** 3 (CORS wildcard in dev mode, Lack of password complexity enforcement on local dev seeds)

## 2. Findings Detail

### P1-01: Header-Based Tenant Identity (IDOR Risk)
- **Component:** `server.ts` (API Middlewares)
- **Description:** Handlers extract tenant context via `req.headers['x-tenant-id'] || 'tenant-highland'`. In the event of an authenticated request where the token is not cross-validated against the requested tenant header, an actor could request resources belonging to another tenant by altering the header.
- **Remediation:** Middleware must decode the authenticated session/JWT, extract `user.tenantId`, and enforce that `req.tenantId = user.tenantId`, rejecting any mismatched header attempts with HTTP 403 Forbidden.

### P2-01: Session Storage & Audit Invalidation
- **Component:** `server/auditService.ts` & `server/auth.ts`
- **Description:** Active hotel access sessions and audit logs reside in in-memory arrays.
- **Remediation:** Offload audit logs and active session states to PostgreSQL tables with immutable append-only constraints.

### P2-02: Rate Limiting on Authentication & Webhook Endpoints
- **Component:** `server.ts`
- **Description:** In-memory rate-limiter is sufficient for single-instance setups but needs Redis-backed sliding window rate limiting when scaled across multiple Cloud Run container instances.

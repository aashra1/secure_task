# SecureTask

SecureTask is a full-stack secure task management application for cybersecurity coursework. It uses Node.js, Express, MongoDB/Mongoose, React, JWT cookies, TOTP MFA, audit logging, Docker, and GitHub Actions.

## Quick Start

1. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Start MongoDB locally or use Docker Compose.
3. Replace secrets in `backend/.env` with strong random values.
4. Run the API:
   ```bash
   cd backend
   npm start
   ```
5. Run the frontend:
   ```bash
   cd frontend
   npm start
   ```

Docker:
```bash
docker compose up --build
```

Frontend: `http://localhost:3001`
Backend health: `http://localhost:3000/health`

## Security Features

- Password policy: 8-128 characters with uppercase, lowercase, number, and special character.
- Password history prevents reuse of the last five passwords.
- Account lockout after five failed attempts for 15 minutes.
- JWT access and refresh tokens are stored in HTTP-only, same-site cookies.
- Refresh token rotation invalidates old refresh tokens.
- MFA uses TOTP with QR code setup and backup codes.
- RBAC supports `user`, `moderator`, and `admin`.
- IDOR prevention checks task ownership before read, update, or delete.
- Mass assignment prevention uses field whitelists in task, profile, and admin updates.
- Express-validator validates endpoint input.
- XSS defenses sanitize task text and request input.
- NoSQL injection prevention uses `express-mongo-sanitize`.
- Helmet sets security headers and CSP.
- CSRF double-submit cookie protection covers unsafe methods.
- Audit logs store security-relevant actions and expire after 90 days.
- AES-256-GCM utilities are available for sensitive field encryption.

## API Summary

Auth endpoints live under `/api/auth`:

- `POST /register`
- `POST /login`
- `POST /verify-mfa`
- `POST /mfa/setup`
- `POST /mfa/confirm`
- `POST /mfa/disable`
- `POST /refresh-token`
- `POST /logout`
- `POST /password/change`
- `POST /password/reset-request`
- `POST /password/reset`
- `GET /verify-email/:token`
- `POST /verify-email/resend`

Task endpoints live under `/api/tasks`:

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`
- `GET /admin/all`

Profile endpoints live under `/api/profile`:

- `GET /me`
- `PUT /me`
- `POST /me/avatar`
- `DELETE /me`
- `GET /me/export`
- `POST /me/import`
- `GET /admin/users`
- `PUT /admin/users/:id`
- `DELETE /admin/users/:id`

## Testing

```bash
cd backend
npm test
```

## Penetration Test Report Template

Project: SecureTask  
Tester: `<your name>`  
Date: `<date>`  
Scope: Auth, task, and profile APIs  
Methodology: OWASP Web Security Testing Guide, manual API testing, code review  

### Finding 1: IDOR in Task Endpoints

CVSS v3.1: 8.1 High  
Vector: `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N`

Technical explanation: If task queries use only `_id`, an authenticated user can access or modify another user's task by guessing or obtaining the task ID.

Exploitation path:
1. User A creates a task.
2. User B sends `GET /api/tasks/<user-a-task-id>`.
3. Vulnerable code returns User A's task.

Remediation: Require authenticated ownership checks on all task resource routes.

Fixed code: `backend/src/middleware/auth.js` uses `Task.findOne({ _id: req.params.id, user: req.user._id })`; `backend/src/routes/tasks.js` applies `checkOwnership('task')`.

Screenshot instructions: Capture a failing cross-user request returning `404` after the fix.

### Finding 2: Mass Assignment in Profile Update

CVSS v3.1: 7.1 High  
Vector: `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:H/A:N`

Technical explanation: If profile updates spread `req.body` into a user document, attackers can set protected fields such as `role`, `isEmailVerified`, or `isActive`.

Exploitation path:
1. Send `PUT /api/profile/me` with `{ "role": "admin" }`.
2. Vulnerable code saves the role.

Remediation: Whitelist profile fields.

Fixed code: `backend/src/controllers/profileController.js` uses `allowedProfileFields = ['name', 'bio', 'avatarUrl']`.

Screenshot instructions: Capture the request body containing `role: admin` and the response showing role remains unchanged.

### Finding 3: NoSQL Injection in Search or Login

CVSS v3.1: 8.8 High  
Vector: `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H`

Technical explanation: Mongo query operators such as `$ne` can alter query meaning if request objects are passed directly to queries.

Exploitation path:
1. Send `{ "email": { "$ne": null }, "password": "x" }`.
2. Vulnerable code may match an unintended user.

Remediation: Sanitize Mongo operators and validate scalar inputs.

Fixed code: `backend/src/middleware/security.js` applies `express-mongo-sanitize`; auth validators require email strings.

Screenshot instructions: Capture a malicious payload and the sanitized rejection.

### Finding 4: Stored XSS in Task Title or Description

CVSS v3.1: 6.1 Medium  
Vector: `CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N`

Technical explanation: Unsanitized task content could persist script payloads and execute when another page renders the task.

Exploitation path:
1. Create task title `<script>alert(document.cookie)</script>`.
2. Visit task list.
3. Vulnerable UI executes script.

Remediation: Sanitize input before storage and avoid dangerous HTML rendering.

Fixed code: `backend/src/models/Task.js` sanitizes title, description, and tags with `xss`; React renders text normally.

Screenshot instructions: Capture the stored task response with stripped script tags.

### Finding 5: Weak Session Management

CVSS v3.1: 8.1 High  
Vector: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N`

Technical explanation: Long-lived bearer tokens without rotation or revocation remain valid after theft.

Exploitation path:
1. Steal a refresh token.
2. Continue minting access tokens indefinitely in vulnerable implementations.

Remediation: Use HTTP-only cookies, short access-token lifetime, refresh-token rotation, server-side session records, and logout invalidation.

Fixed code: `backend/src/services/authService.js` rotates refresh tokens and stores hashed session tokens; `backend/src/middleware/auth.js` checks session `jti`.

Screenshot instructions: Capture old refresh token reuse returning `401` after a refresh.

## Sample Audit Log Entries

```json
{"type":"audit","user":"667f...","action":"LOGIN_SUCCESS","status":"success","ip":"127.0.0.1","userAgent":"Mozilla/5.0"}
{"type":"audit","user":"667f...","action":"LOGIN_FAILURE","status":"failure","details":{"email":"student@example.com"}}
{"type":"audit","user":"667f...","action":"TASK_UPDATED","status":"success","details":{"taskId":"6680..."}}
```

## Sample CVSS Calculations

- IDOR: Network exploitable, low complexity, low privileges, no user interaction, high confidentiality and integrity impact: 8.1.
- XSS: Network exploitable, low complexity, low privileges, requires user interaction, changed scope, low confidentiality and integrity impact: 6.1.
- Weak session management: Network exploitable, low complexity, no privileges after token theft, high confidentiality and integrity impact: 8.1.

## Remediation Timeline

- Day 1: Confirm vulnerability and reproduce with HTTP requests.
- Day 2: Implement validation, authorization, or session fix.
- Day 3: Add regression tests.
- Day 4: Re-test exploit path and document evidence.
- Day 5: Peer review and submit final report.

## Screenshot Checklist

- Login rate limit response after repeated attempts.
- Account lockout response after five failed logins.
- MFA QR setup and backup code generation.
- IDOR test showing cross-user task access fails.
- Mass assignment test showing role cannot be self-updated.
- XSS payload stored without executable script tags.
- Audit log entry for login or task update.

## Commit Message Bank

- feat: Add Express API bootstrap
- feat: Add MongoDB connection retry logic
- feat: Add secure user model
- feat: Add task model with sanitization
- feat: Add audit log model with TTL
- feat: Add JWT cookie authentication
- feat: Add refresh token rotation
- feat: Implement MFA with TOTP
- feat: Add MFA backup codes
- feat: Add email verification flow
- feat: Add password reset flow
- feat: Add password history validation
- feat: Add account lockout tracking
- feat: Add task CRUD service
- feat: Add profile management endpoints
- feat: Add admin user management
- feat: Add React auth context
- feat: Add protected route wrapper
- feat: Add task dashboard
- feat: Add task creation modal
- feat: Add task detail editing
- feat: Add profile security controls
- feat: Add admin dashboard
- security: Add Helmet security headers
- security: Add content security policy
- security: Add CORS credential controls
- security: Add auth endpoint rate limiting
- security: Add general API rate limiting
- security: Add CSRF double-submit protection
- security: Add NoSQL injection sanitization
- security: Add XSS request sanitization
- security: Add RBAC middleware
- security: Add task ownership checks
- security: Add field whitelists for updates
- security: Store refresh tokens as hashes
- fix: Fix IDOR vulnerability in task update
- fix: Fix mass assignment in profile update
- fix: Fix NoSQL injection in login
- fix: Fix stored XSS in task fields
- fix: Fix weak refresh token reuse
- test: Add auth security tests
- test: Add task endpoint tests
- docs: Add API documentation
- docs: Add pentest report template
- docs: Add CVSS examples
- chore: Add backend Dockerfile
- chore: Add frontend Dockerfile
- chore: Add Docker Compose stack
- ci: Add GitHub Actions pipeline

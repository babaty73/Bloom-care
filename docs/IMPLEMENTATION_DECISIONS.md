# Bloom-Care Implementation Decisions

## Purpose

This document resolves implementation-level decisions that are not fully specified by the Bloom-Care Project Specification or `docs/ARCHITECTURE.md`.

Its purpose is to ensure that the two developers, and their separate Claude coding sessions, implement the same contracts without independently making incompatible technical choices.

This document is documentation only. It does not implement application behavior.

## Authority

The project follows this authority hierarchy:

1. **Project Specification** — highest-level product source of truth.
2. **`docs/ARCHITECTURE.md`** — architectural structure and implementation contracts.
3. **`docs/IMPLEMENTATION_DECISIONS.md`** — implementation-level decisions that clarify the first two documents.

This document cannot override the specification or architecture. If a future decision conflicts with either, the higher-level source wins and the change must be documented.

Decision labels:

- **DECIDED** — developers and Claude may implement this choice.
- **PENDING CONFIRMATION** — developers/Claude must not independently choose it.

---

# Authentication Decisions

## 1. JWT claim structure

**Status: DECIDED**

Use the standard JWT `sub` claim as the authenticated account identifier.

JWT payload:

```json
{
  "sub": "<MongoDB ObjectId as string>",
  "role": "pharmacy"
}
```

or:

```json
{
  "sub": "<MongoDB ObjectId as string>",
  "role": "admin"
}
```

Rules:

- `sub` identifies the authenticated MongoDB document.
- `role` is exactly `"pharmacy"` or `"admin"`.
- Do not put `password`, `passwordHash`, email, phone, or other profile data in the token.
- Do not create separate `pharmacyId` or `adminId` claims when `sub` already identifies the authenticated account.

## 2. Token expiration

**Status: DECIDED**

JWT access tokens expire **7 days after issuance**.

Refresh tokens are not part of the MVP because refresh-token functionality is not required by the specification.

An expired token is treated as unauthenticated and produces the standard `401` response.

## 3. Password hashing

**Status: DECIDED**

Passwords must never be stored in plaintext.

Use **bcrypt** with a work factor of **12**.

- Pharmacy password input is converted into `Pharmacy.passwordHash`.
- The Admin specification field `password` stores the secure hashed representation despite the specification's field name.
- Password hashes are never returned through the API.
- Login compares the submitted password against the stored hash.

The hashing dependency is to be added when authentication is implemented; it was intentionally not part of Phase 1.

## 4. Authentication middleware

**Status: DECIDED**

Authentication middleware must:

1. Read `Authorization: Bearer <token>`.
2. Reject a missing or malformed token with `401`.
3. Verify the JWT signature and expiration.
4. Extract `sub` and `role`.
5. Attach the authenticated identity to the request.
6. Leave domain ownership checks to the appropriate service.

Authentication middleware must not contain pharmacy-specific or medicine-specific business rules.

## 5. Role authorization

**Status: DECIDED**

Backend role authorization is authoritative.

- Pharmacy routes require `role === "pharmacy"`.
- Admin routes require `role === "admin"`.
- Public visitor functionality requires no account.
- Frontend route protection is a navigation/UX guard only and is never the security boundary.

## 6. Frontend token handling

**Status: DECIDED**

For the MVP, store the JWT in `localStorage` using the key:

```text
bloomcare_token
```

`AuthContext` owns the application's authentication state.

Rules:

- The shared API client attaches the token to protected requests.
- Components must not independently read and attach JWTs.
- JWTs must not be placed in URLs, query parameters, or request bodies.
- Authentication state must never expose the password or password hash.

## 7. Logout

**Status: DECIDED**

Logout is client-side:

1. Remove `bloomcare_token` from `localStorage`.
2. Clear authentication state.
3. Navigate to the appropriate public route.

No server logout/revocation endpoint is required by the MVP specification.

---

# API Decisions

## 1. Base path

**Status: DECIDED**

All application API routes use:

```text
/api
```

as their base prefix.

## 2. Success response

**Status: DECIDED**

Every successful application response uses:

```json
{
  "success": true,
  "data": {},
  "message": "Human-readable success message"
}
```

`data` may be an object, array, or `null`.

## 3. Error response

**Status: DECIDED**

Every application error uses:

```json
{
  "success": false,
  "data": null,
  "message": "Human-readable error message",
  "error": {
    "code": "ERROR_CODE",
    "details": []
  }
}
```

Validation details should use a consistent structure such as:

```json
{
  "field": "email",
  "message": "Invalid email address"
}
```

`details` may be empty when no structured details are necessary.

## 4. Error-code naming

**Status: DECIDED**

Use uppercase `SCREAMING_SNAKE_CASE`.

Examples:

```text
VALIDATION_ERROR
AUTHENTICATION_REQUIRED
INVALID_CREDENTIALS
TOKEN_EXPIRED
FORBIDDEN
RESOURCE_NOT_FOUND
DUPLICATE_EMAIL
INVALID_REPORT_REASON
INVALID_QUANTITY
INCONSISTENT_PHARMACY_REFERENCE
INTERNAL_SERVER_ERROR
```

Error codes are stable programmatic identifiers. Human-readable messages may change without changing the code's meaning.

## 5. HTTP status conventions

**Status: DECIDED**

| Status | Meaning |
|---|---|
| `200` | Successful retrieval, update, or action |
| `201` | Successful resource creation |
| `204` | Successful deletion with no response body |
| `400` | Invalid request, query, path parameter, or validation failure |
| `401` | Missing/invalid/expired authentication or invalid login credentials |
| `403` | Authenticated but lacking required role or ownership permission |
| `404` | Requested resource does not exist or is unavailable to the requesting public surface |
| `409` | Uniqueness or resource conflict |
| `500` | Unexpected server-side failure |

Do not return `200` for failed operations.

## 6. ID handling

**Status: DECIDED**

MongoDB ObjectIds are the application's resource identifiers.

Rules:

- API path IDs are ObjectId strings.
- Validate ObjectId format before service/database operations.
- Invalid ObjectId syntax produces `400`.
- A valid ObjectId that does not identify an existing resource produces `404`.
- No second application-level ID is introduced.

## 7. Controller/service boundary

**Status: DECIDED**

Controllers are thin request/response adapters.

Controllers may:

- read validated request values,
- read authenticated identity,
- call services,
- choose the appropriate HTTP status,
- return the standard response envelope.

Controllers must not:

- contain database queries,
- contain domain business rules,
- perform ownership decisions,
- duplicate service logic.

Services own domain operations and business rules.

---

# Pharmacy Decisions

## 1. Registration fields

**Status: DECIDED**

Pharmacy registration collects:

```text
pharmacyName
address
phone
email
password
googleMapsLink
openingTime
closingTime
logo (optional)
```

The password is an input-only field.

It is converted to `passwordHash` and is never stored as plaintext or returned.

## 2. Pharmacy email

**Status: DECIDED**

Pharmacy email is:

- required,
- validated as an email address,
- normalized to lowercase,
- unique.

Email is the pharmacy login identifier.

Two pharmacy accounts cannot use the same email.

## 3. Password requirements

**Status: DECIDED**

MVP password requirements:

- minimum 8 characters,
- at least one letter,
- at least one number.

No additional password-complexity rules are introduced.

## 4. Opening/closing time representation

**Status: DECIDED**

Store both fields as strings in 24-hour:

```text
HH:mm
```

Examples:

```text
08:00
13:30
21:00
```

No date component is stored because the values represent recurring daily opening hours.

## 5. Business timezone

**Status: DECIDED**

Use:

```text
Africa/Addis_Ababa
```

for pharmacy opening-status calculations.

The browser's local timezone must not silently determine the application's authoritative pharmacy status.

## 6. Overnight hours

**Status: DECIDED**

Normal schedule:

```text
closingTime > openingTime
```

means the pharmacy is open during the same-day interval.

Overnight schedule:

```text
closingTime < openingTime
```

means closing occurs on the following day.

Equal times:

```text
closingTime === openingTime
```

are invalid. The MVP does not define 24-hour pharmacies.

## 7. Public vs private pharmacy fields

**Status: DECIDED**

Public pharmacy responses may expose:

```text
_id
pharmacyName
address
phone
googleMapsLink
openingTime
closingTime
logo
isOpen
```

Do not expose:

```text
passwordHash
```

The pharmacy email is not part of the ordinary public pharmacy-result payload.

---

# Medicine Decisions

## 1. Pharmacy-specific listing

**Status: DECIDED**

Each Medicine document represents one pharmacy's inventory listing.

Relationship:

```text
Medicine.pharmacyId → Pharmacy._id
```

Medicine is not a global medicine catalog entity.

Different pharmacies may therefore maintain separate listings for the same medicine.

Do not create a global unique constraint on `medicineName` or `genericName`.

## 2. Quantity and availability

**Status: DECIDED**

Both fields are required:

```text
quantity
inStock
```

Rules:

```text
quantity < 0 → invalid
quantity === 0 → inStock must be false
quantity > 0 → inStock must be true
```

The service layer is authoritative for maintaining this cross-field invariant.

The client must not be able to create a contradictory state by independently forcing `inStock`.

## 3. Price

**Status: DECIDED**

`price` is a non-negative number.

Zero is technically valid because the specification does not define a positive minimum.

Prices represent the pharmacy-provided ETB price.

No currency conversion is performed.

Price comparison is numerical, not lexicographical.

## 4. Expiration

**Status: DECIDED**

`expirationDate` is required and stored as a MongoDB `Date`.

A listing is expired when its expiration date has been reached according to the application's business date/time rules.

Expired listings:

- remain stored,
- are not physically deleted,
- are excluded from public medicine search,
- are excluded from public medicine details,
- remain available to authorized administrative/business logic where appropriate.

## 5. `lastUpdated`

**Status: DECIDED**

`lastUpdated` is the user-facing freshness timestamp for medicine inventory information.

Update it when the pharmacy changes information relevant to:

- price,
- quantity,
- availability,
- or other materially relevant public inventory information.

`updatedAt` remains the general database modification timestamp.

`updatedAt` must not replace `lastUpdated` in the public trust indicator.

## 6. Search fields

**Status: DECIDED**

Public medicine search uses:

```text
medicineName
genericName
```

Generic-name search is explicitly required by the specification.

Brand-name search is not introduced as an additional search capability.

## 7. Search matching

**Status: DECIDED**

Search is:

- case-insensitive,
- whitespace-trimmed,
- partial-match capable.

A query such as `para` may match a value containing `para`.

The search term may be evaluated against both `medicineName` and `genericName`.

## 8. Search normalization

**Status: DECIDED**

For comparison:

- trim leading/trailing whitespace,
- use case-insensitive comparison.

Stored display values are not modified merely to support search.

## 9. Search result ordering

**Status: DECIDED**

Public results are ordered:

1. In-stock listings first.
2. Lower price first within the same availability group.
3. More recently updated listings first when previous values are equal.
4. `_id` as the final stable tie-breaker.

Distance-based ordering is not implemented until the distance decision is confirmed.

## 10. Pagination

**Status: DECIDED**

Public medicine search uses pagination.

Default:

```text
page = 1
limit = 20
```

Maximum:

```text
limit = 50
```

Invalid pagination values produce `400`.

Pagination metadata belongs inside `data` while the standard API envelope remains unchanged.

## 11. Public medicine result

**Status: DECIDED**

Public medicine results expose the information required by the visitor experience.

Medicine information:

```text
_id
medicineName
genericName
brandName
description
category
price
quantity
inStock
expirationDate
lastUpdated
```

Associated pharmacy information:

```text
_id
pharmacyName
address
phone
googleMapsLink
openingTime
closingTime
logo
isOpen
```

Never expose `passwordHash`.

## 12. Pharmacy inventory ownership

**Status: DECIDED**

A pharmacy may create, update, and delete only its own Medicine listings.

The backend derives the pharmacy identity from `JWT.sub`.

The client must not be trusted to provide a pharmacy ID as proof of ownership.

If the target listing belongs to another pharmacy:

```text
403 FORBIDDEN
```

---

# Report Decisions

## 1. Report reasons

**Status: DECIDED**

Use these exact internal enum values:

```text
MEDICINE_NOT_AVAILABLE
WRONG_PRICE
WRONG_LOCATION
PHARMACY_PERMANENTLY_CLOSED
EXPIRED_MEDICINE
OTHER
```

These correspond directly to the report reasons specified by the product.

Human-readable labels belong to the presentation layer.

## 2. Additional comment

**Status: DECIDED**

`additionalComment` is optional.

When supplied, it must be a string containing meaningful non-whitespace content.

An implementation-level maximum length should be enforced to prevent abuse; the exact UI wording is not part of the contract.

## 3. Report status

**Status: DECIDED**

Use:

```text
PENDING
RESOLVED
REJECTED
```

Initial status:

```text
PENDING
```

Definitions:

- `PENDING` — awaiting admin review.
- `RESOLVED` — admin determined that corrective action was required and completed the relevant administrative response.
- `REJECTED` — admin reviewed the report and determined that no corrective action was required.

## 4. Status transitions

**Status: DECIDED**

Allowed transitions:

```text
PENDING → RESOLVED
PENDING → REJECTED
```

No further transition is required by the MVP.

## 5. Report permissions

**Status: DECIDED**

- Visitors/public users may create reports.
- Pharmacies may view reports concerning their own pharmacy/listings.
- Admins may view all reports and change report status.
- Pharmacies cannot change report status.
- Visitors do not receive report-management permissions.

## 6. Referenced resources

**Status: DECIDED**

When creating a report:

- `medicineId` must reference an existing Medicine listing.
- `pharmacyId` must reference an existing Pharmacy.
- `medicine.pharmacyId` must equal the submitted `pharmacyId`.

Invalid relationship:

```text
400
```

Missing referenced resource:

```text
404
```

An expired Medicine can still be reported because expiration is non-destructive.

## 7. Report deletion

**Status: DECIDED**

No public report-deletion operation is part of the MVP.

Report review is represented through status.

---

# Pharmacy Status Decisions

## 1. Time format

**Status: DECIDED**

Use `HH:mm` in 24-hour format.

## 2. Timezone

**Status: DECIDED**

Use `Africa/Addis_Ababa`.

## 3. Authoritative calculation

**Status: DECIDED**

The backend is authoritative for `isOpen`.

The frontend displays the backend-provided status and must not create a competing business rule.

## 4. Normal hours

**Status: DECIDED**

For `openingTime < closingTime`, the pharmacy is open when:

```text
openingTime <= currentTime < closingTime
```

## 5. Overnight hours

**Status: DECIDED**

For `closingTime < openingTime`, the pharmacy is open when:

```text
currentTime >= openingTime
OR
currentTime < closingTime
```

Equal opening/closing times are invalid.

---

# Distance Decision

## Status: DECIDED

The specification requires nearby pharmacies and displayed distances such as `1 km away` and `2 km away`.

The pharmacy UX continues to use the specified Google Maps shared-link workflow. No manual latitude/longitude entry exists anywhere in the pharmacy forms.

The architectural flow is:

```text
Google Maps shared link
        ↓
Geoapify location resolution (pharmacy create/update only)
        ↓
latitude/longitude stored internally on Pharmacy
        ↓
straight-line distance calculation (backend, Haversine — no routing API)
        ↓
displayed distance
```

Resolved details:

- **Geocoding provider**: Geoapify (forward geocoding endpoint). Called from `utils/googleMaps.js` — the same file that already owned Google Maps shared-link handling.
- **When Geoapify is called**: only when a pharmacy creates or updates its `googleMapsLink` (registration, or profile update where `googleMapsLink` changes). Never on visitor search — public search never re-geocodes.
- **Coordinate storage**: `Pharmacy.location = { latitude, longitude }`, resolved internally, `null` until resolved. Never exposed in any API response — internal to distance calculation only. Resolution is best-effort: if Geoapify is unavailable or the link can't be resolved, pharmacy create/update still succeeds and `location` stays `null` rather than saving invalid/partial coordinates; that pharmacy is simply excluded from distance-sorted results until its link resolves. Flagged for developer confirmation as an implementation choice, not mandated by this decision.
- **Distance calculation**: straight-line (Haversine) in `utils/distance.js`, computed on the backend. No routing API, no external distance provider.
- **Visitor location source**: browser Geolocation API, requested by the frontend only when the visitor asks for nearby/distance functionality (not on every page load). Visitor coordinates are never persisted — not to the database, not to browser storage, not in the URL — they exist only in frontend component state for the duration of the request.
- **Public search integration**: `GET /api/medicines` accepts optional `lat`/`lng` query params (validated as real-world latitude/longitude, both-or-neither). When supplied, each result gets an additive `distanceKm` field and results are sorted nearest-first (unresolved-location pharmacies sorted last), ahead of the existing in-stock/price/lastUpdated/`_id` tie-break ordering. When omitted, search behavior and response shape are unchanged from before this decision.
- **Excluded Geoapify features**: no routing, autocomplete, or reverse geocoding — forward geocoding only.

---

# Notification Decision

## Status: PENDING CONFIRMATION — DELIVERY PROVIDER

The specification requires expiration notifications for:

- the affected pharmacy,
- the admin.

The internal application boundary is decided:

```text
expiration service
        ↓
notification service
        ↓
delivery mechanism
```

The notification service should receive enough information to identify:

- notification/event type,
- recipient role,
- recipient/account ID,
- medicine ID,
- pharmacy ID,
- relevant human-readable context.

The notification service must not depend directly on a delivery provider.

The delivery mechanism is **not decided**.

Claude must not independently choose email, SMS, push notification, or another provider.

---

# Expiration Decision

## 1. Non-destructive expiration

**Status: DECIDED**

Expired Medicine records are never physically deleted solely because they expired.

They remain available to authorized administrative/business logic where appropriate.

Public search and public medicine details must exclude expired listings.

## 2. Expiration execution

**Status: PENDING CONFIRMATION**

The existing `expiration.service.js` is the business boundary.

The specification requires automatic expiration handling but does not specify the execution mechanism.

No decision has been made to use cron, a worker, a queue, a cloud scheduler, or another mechanism.

Claude must not independently add one.

## 3. Expiration effects

**Status: DECIDED**

When expiration processing is eventually triggered, the intended application flow is:

```text
identify expired listings
        ↓
ensure exclusion from public results
        ↓
request pharmacy notification
        ↓
request admin notification
```

No physical deletion occurs.

---

# Admin Provisioning Decision

## Status: PENDING CONFIRMATION

Admin login is required.

The specification does not define how the initial admin account is created.

Therefore:

- no public admin registration,
- no admin registration API,
- no hardcoded default admin,
- no hardcoded admin credentials

may be introduced.

A secure admin-provisioning mechanism must be explicitly agreed before admin authentication is deployed.

---

# Emergency Number Decision

## Status: PENDING CONFIRMATION

The navigation must expose the emergency-call feature required by the specification.

The actual emergency number is not supplied.

Therefore:

- do not invent a number,
- do not hardcode a guessed number,
- do not embed the number in multiple components.

Once confirmed, the number should be supplied through the application's configuration/environment boundary.

The actual number requires explicit confirmation before implementation.

---

# Logo/Storage Decision

## 1. Logo field

**Status: DECIDED**

The Pharmacy `logo` field remains optional.

The MVP must not require an image-storage provider merely to function.

## 2. Storage provider

**Status: PENDING CONFIRMATION**

Cloudinary is listed as optional by the specification.

If actual logo upload is implemented, the developers must agree on the storage mechanism first.

Claude must not independently select Cloudinary, local filesystem storage, S3, another cloud provider, or another storage service.

If no storage decision is confirmed, logo-upload functionality may remain unimplemented while the optional `logo` field and architecture remain intact.

---

# Frontend Implementation Conventions

## 1. Typed API responses

**Status: DECIDED**

Frontend services use TypeScript types matching the backend API contracts.

The common response concepts are:

```text
ApiSuccess<T>
ApiError
```

Services expose typed domain results to pages/components rather than raw HTTP-library responses.

## 2. Service naming

**Status: DECIDED**

Use the established domain services:

```text
auth.service.ts
medicine.service.ts
pharmacy.service.ts
report.service.ts
admin.service.ts
```

Do not create one generic service containing all API operations.

## 3. API client

**Status: DECIDED**

`frontend/src/utils/api.ts` is the shared HTTP client boundary.

Domain services use this client.

Pages/components must not create independent API clients or duplicate base-URL configuration.

## 4. Error handling

**Status: DECIDED**

Frontend code consumes the standard backend error structure.

Use `error.code` for programmatic decisions where necessary.

Use `message` for general user-facing feedback.

Do not parse human-readable error strings when a stable error code is available.

## 5. Authentication state

**Status: DECIDED**

`AuthContext` owns application authentication state.

`useAuth` is the reusable access point.

Components must not maintain a second global authentication state.

## 6. Route protection

**Status: DECIDED**

- Public routes require no authentication.
- Pharmacy routes require authenticated pharmacy state.
- Admin routes require authenticated admin state.
- Backend authorization remains the security boundary.

## 7. Loading states

**Status: DECIDED**

Every asynchronous page operation must explicitly represent loading.

Use the established shared loading component where appropriate.

## 8. Error states

**Status: DECIDED**

Failed asynchronous operations must have an explicit error state.

Use the shared error component where appropriate.

## 9. Empty states

**Status: DECIDED**

Data-driven pages distinguish:

```text
loading
error
successful empty result
successful populated result
```

An empty medicine search result is not a server error.

---

# Backend Implementation Conventions

## 1. Controller naming

**Status: DECIDED**

Use:

```text
<domain>.controller.js
```

Examples:

```text
auth.controller.js
medicine.controller.js
pharmacy.controller.js
report.controller.js
admin.controller.js
```

Controller functions should use clear action-oriented names.

## 2. Service naming

**Status: DECIDED**

Use:

```text
<domain>.service.js
```

Services contain domain/application operations and business rules.

## 3. Route naming

**Status: DECIDED**

Use the established domain-oriented route structure.

Examples:

```text
/api/auth/...
/api/medicines/...
/api/pharmacies/...
/api/reports/...
/api/admin/...
```

Do not reorganize APIs around separate visitor/pharmacy/admin copies of every domain.

## 4. Validation

**Status: DECIDED**

Validation follows:

```text
route
  ↓
validation middleware
  ↓
controller
  ↓
service
```

Validation middleware handles request shape and basic constraints.

Services handle domain and cross-document rules.

Mongoose handles persistence-level validation.

## 5. Centralized errors

**Status: DECIDED**

Use centralized error middleware.

Unexpected errors become `500 INTERNAL_SERVER_ERROR`.

Do not expose stack traces, database internals, password hashes, JWT secrets, or credentials in production responses.

## 6. Mongoose references

**Status: DECIDED**

Use ObjectId references:

```text
Medicine.pharmacyId → Pharmacy
Report.medicineId → Medicine
Report.pharmacyId → Pharmacy
```

Do not duplicate complete Pharmacy or Medicine documents inside these records.

## 7. Ownership checks

**Status: DECIDED**

Ownership is checked server-side.

For pharmacy-owned resources:

```text
JWT.sub
    ↓
authenticated pharmacy
    ↓
target resource.pharmacyId
    ↓
must match
```

A client-supplied pharmacy ID is never accepted as proof of ownership.

## 8. Async handling

**Status: DECIDED**

Use `async/await`.

Asynchronous failures must reach centralized error handling.

Do not silently swallow rejected promises.

## 9. Environment variables

**Status: DECIDED**

Environment-specific configuration and secrets belong in environment variables.

Real `.env` files are not committed.

`.env.example` files document variable names without real credentials.

Unrelated application files should use the established environment configuration boundary rather than reading environment variables arbitrarily throughout the codebase.

## 10. Sensitive data

**Status: DECIDED**

Never return or log:

- passwords,
- password hashes,
- JWT secrets,
- database credentials,
- other authentication secrets.

Authentication data must not be left in debug logging in production.

---

# Decisions Requiring Developer Confirmation

The following decisions remain intentionally unresolved because choosing them would require an external-provider or product/infrastructure choice that is not supplied by the specification.

| Decision | Status | Required confirmation |
|---|---|---|
| Nearby pharmacy distance | **PENDING CONFIRMATION** | Location resolution, usable-location strategy, distance mechanism, user-location source |
| Notification delivery | **PENDING CONFIRMATION** | Email/SMS/push/other delivery mechanism |
| Expiration scheduling | **PENDING CONFIRMATION** | Cron/worker/scheduler/other execution mechanism |
| Admin provisioning | **PENDING CONFIRMATION** | Secure method for creating the initial admin |
| Emergency number | **PENDING CONFIRMATION** | Actual emergency number |
| Logo storage | **PENDING CONFIRMATION** | Storage mechanism if logo upload is implemented |

The following are already decided and must not be independently changed:

| Decision | Status | Contract |
|---|---|---|
| JWT identifier | **DECIDED** | `sub` |
| JWT role | **DECIDED** | `pharmacy` or `admin` |
| JWT lifetime | **DECIDED** | 7 days |
| Password hashing | **DECIDED** | bcrypt, work factor 12 |
| Pharmacy password minimum | **DECIDED** | 8 characters, one letter, one number |
| Pharmacy email | **DECIDED** | Required, lowercase-normalized, unique |
| Pharmacy hours | **DECIDED** | `HH:mm`, Africa/Addis_Ababa |
| Medicine identity | **DECIDED** | Pharmacy-specific inventory listing |
| Quantity/availability | **DECIDED** | `quantity > 0` means in stock; `quantity = 0` means out of stock |
| Report reasons | **DECIDED** | Six specified enum values |
| Report statuses | **DECIDED** | `PENDING`, `RESOLVED`, `REJECTED` |
| API success envelope | **DECIDED** | `{ success, data, message }` |
| API error envelope | **DECIDED** | `{ success, data, message, error }` |
| ID format | **DECIDED** | MongoDB ObjectId |
| Public search | **DECIDED** | Case-insensitive partial search over medicine/generic name |
| Pagination | **DECIDED** | Default 20, maximum 50 |
| Expiration | **DECIDED** | Non-destructive; excluded from public results |

---

# Rules for Future Changes

1. Never silently change a **DECIDED** contract.
2. Never convert a **PENDING CONFIRMATION** decision into an implementation choice without explicit developer agreement.
3. If the product specification changes, update the specification first.
4. If the architecture changes, update `docs/ARCHITECTURE.md` before changing dependent implementation behavior.
5. Update this document whenever an implementation-level decision changes.
6. Document why a changed decision was necessary.
7. Never add a product feature merely because it is technically convenient.
8. Never select an external provider where the architecture leaves the provider unresolved.
9. Keep API response envelopes, database relationships, authentication claims, and validation conventions synchronized between frontend and backend.
10. Contract-sensitive changes require communication between both developers before dependent work is merged.
11. Both Claude coding sessions must treat this document as a constraint, not permission to invent missing product requirements.
12. When a pending decision affects only one domain, that domain must not make assumptions that constrain the other developer's implementation.
13. Shared contract changes must be agreed upon before either developer implements dependent code.
14. If the specification and this document appear to conflict, the specification wins and the conflict must be documented rather than silently resolved.

---

# Implementation Readiness

## Status: READY FOR IMPLEMENTATION WITH EXPLICIT PENDING DECISIONS

The core implementation contracts are sufficiently defined for the two developers to begin most MVP implementation consistently.

The following must be explicitly confirmed **before implementing the affected functionality**:

1. **Nearby pharmacy distance** — location resolution and distance mechanism.
2. **Notification delivery** — provider/channel.
3. **Expiration scheduling** — execution mechanism.
4. **Admin provisioning** — secure initial-admin creation method.
5. **Emergency number** — actual number.
6. **Logo storage** — only if actual logo upload is implemented.

These pending decisions do not authorize either developer or Claude to invent an implementation.

All other decisions marked **DECIDED** may be implemented consistently with the Project Specification and `docs/ARCHITECTURE.md`.

No application code, API endpoint implementation, database schema implementation, authentication implementation, UI functionality, or business logic is defined by this document.

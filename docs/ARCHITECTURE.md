# Bloom-Care Architecture & Implementation Contracts

## Source of Truth

The Bloom-Care project specification supplied for this project is the single source of truth. This document translates that specification into technical contracts for implementation. It must not be interpreted as authorization to add product features that are outside the specification.

Where the specification is incomplete, this document records the most conservative contract needed to allow implementation without silently selecting an external provider or inventing a product capability.

## Architectural Scope

The repository is structured for a React + TypeScript + Tailwind CSS frontend and a Node.js + Express + MongoDB backend, with JWT authentication, React Router, Framer Motion, React Icons, and Google Maps shared-location links as specified.

This document establishes contracts only. It does not implement authentication, CRUD, API endpoints, database schemas, search, distance calculation, notifications, expiration execution, report handling, or UI/business logic.

## Major Modules

### Public visitor experience

Visitors do not create accounts. The public surface supports the specified medicine search, medicine details, pharmacy details, availability, price comparison, last-updated information, open/closed status, pharmacy calling, Google Maps directions, and reporting entry point.

### Pharmacy management

Pharmacies register/login, maintain pharmacy information, manage their medicine/inventory listings, and view reports submitted about their listings as required by the specification.

### Admin management

Admins manage pharmacies, review reports, moderate/remove inappropriate medicine listings, remove fake pharmacies, suspend/ban pharmacies, and view platform statistics/system health.

### Authentication and authorization

JWT authentication is required for authenticated roles. Backend authorization is role-based. Visitors remain public and do not require accounts.

### Medicine/inventory

`Medicine` is a pharmacy-specific medicine/inventory listing. A medicine listing belongs to one pharmacy through `pharmacyId`. Multiple pharmacies can therefore have separate listings for the same medicine, allowing availability and price comparison across pharmacies.

### Reports

Reports retain both `medicineId` and `pharmacyId` because both fields are explicitly specified. The relationship must be validated so that a report's pharmacy corresponds to the pharmacy owning the referenced medicine listing.

### Expiration

Expiration handling is non-destructive. Expired medicine records are not physically deleted. They must be excluded from public medicine search/results while remaining available to authorized administrative/business logic where appropriate. The expiration service is an architectural boundary only; no execution mechanism or scheduler is selected.

### Notifications

`notification.service.js` is an abstraction boundary for the explicit requirement that expiration events notify the pharmacy and admin. No email, SMS, push, or other delivery provider is selected or implemented.

### Pharmacy open/closed status

Pharmacy opening and closing times are the stored source data. Backend pharmacy-status calculation is authoritative for application behavior and returned status. Frontend status handling is for presentation only and must not become a competing business rule.

### Google Maps and distance

The pharmacy UX uses the specified Google Maps shared-link workflow. Pharmacies are not asked to manually enter latitude/longitude.

The unresolved location architecture is:

`Google Maps shared link → location resolution → usable location → distance calculation → displayed distance`

No geocoding API, Google Maps API integration, distance provider, or coordinate-entry workflow is selected at this stage.

## Database Relationships

### Pharmacy → Medicine

One pharmacy can have many medicine/inventory listings. Each medicine listing contains `pharmacyId` and represents the listing at that particular pharmacy.

### Medicine → Report

A report references a medicine listing through `medicineId` and its pharmacy through `pharmacyId`. Both are retained because the specification explicitly defines both fields. The two references must remain consistent.

### Admin

Admin is a separate authenticated role with its specified identity fields. The specification does not define an admin registration/provisioning mechanism, so none is established here.

# Implementation Contracts

## 1. Database Schema Contracts

MongoDB/Mongoose is the database layer. The following contracts describe the intended document structures. `id` in the project specification maps to MongoDB's document identifier (`_id`) in implementation; no second application-level identifier is required by this architecture.

### 1.1 Admin

| Field | Type | Required | Default | Relationship | Constraints / validation |
|---|---|---:|---|---|---|
| `_id` | ObjectId | Yes (MongoDB) | MongoDB-generated | — | Unique by MongoDB |
| `name` | String | Yes | — | — | Must be a non-empty name |
| `email` | String | Yes | — | — | Valid email format; unique because it is the authentication identity |
| `password` | String | Yes | — | — | Must contain the secure stored password representation used by the authentication implementation; plaintext passwords must never be stored |

**Contract note:** The specification explicitly names the field `password`. Unlike Pharmacy, it does not explicitly name `passwordHash`. The implementation must therefore treat this field as the secure stored credential representation rather than storing plaintext. This is a security interpretation of the required authentication field, not a new product field.

### 1.2 Pharmacy

| Field | Type | Required | Default | Relationship | Constraints / validation |
|---|---|---:|---|---|---|
| `_id` | ObjectId | Yes (MongoDB) | MongoDB-generated | Referenced by `Medicine.pharmacyId` and `Report.pharmacyId` | Unique by MongoDB |
| `pharmacyName` | String | Yes | — | — | Must be non-empty |
| `address` | String | Yes | — | — | Must be non-empty |
| `phone` | String | Yes | — | — | Must be a non-empty phone value |
| `email` | String | Yes | — | — | Valid email format; uniqueness is justified because pharmacy login requires an identity |
| `passwordHash` | String | Yes | — | — | Secure password representation; never store the plaintext password |
| `googleMapsLink` | String | Yes | — | — | Must contain the pharmacy's Google Maps shared location link; no manual latitude/longitude fields |
| `openingTime` | String | Yes | — | — | Must represent the agreed time format used by the application |
| `closingTime` | String | Yes | — | — | Must represent the agreed time format used by the application |
| `logo` | String | No | — | — | Optional logo reference as allowed by the specification |
| `createdAt` | Date | Yes | Mongoose timestamps | — | Creation timestamp |
| `updatedAt` | Date | Yes | Mongoose timestamps | — | Last document update timestamp |

**Technically necessary addition:** `passwordHash` is required because the specification explicitly requires Pharmacy registration/login but its listed Pharmacy fields contain no password/credential field. The architecture adds only this credential representation needed to support that explicit requirement.

**Email uniqueness:** A unique pharmacy email is justified because email is part of the pharmacy authentication identity. The specification does not state whether two pharmacies may share an email, so this is a technical authentication constraint that should be confirmed before production deployment if shared owner emails are expected.

### 1.3 Medicine

A Medicine document is a **pharmacy-specific inventory listing**, not a global medicine catalog record.

| Field | Type | Required | Default | Relationship | Constraints / validation |
|---|---|---:|---|---|---|
| `_id` | ObjectId | Yes (MongoDB) | MongoDB-generated | — | Unique by MongoDB |
| `pharmacyId` | ObjectId | Yes | — | Reference to `Pharmacy._id` | Referenced pharmacy must exist when creating/updating a listing |
| `medicineName` | String | Yes | — | — | Must be non-empty |
| `genericName` | String | Yes | — | — | Must be non-empty; supports generic-name search |
| `brandName` | String | No | — | — | Optional |
| `description` | String | Yes | — | — | Must contain the medicine description required by the specification |
| `category` | String | Yes | — | — | Must be non-empty |
| `price` | Number | Yes | — | — | Must represent a valid non-negative price |
| `quantity` | Number | Yes | — | — | Must be a non-negative quantity |
| `inStock` | Boolean | Yes | — | — | Must remain consistent with `quantity` |
| `lastUpdated` | Date | Yes | On inventory/price-relevant update | — | Represents the latest inventory information update, not merely arbitrary document modification |
| `createdAt` | Date | Yes | Mongoose timestamps | — | Creation timestamp |
| `updatedAt` | Date | Yes | Mongoose timestamps | — | Document modification timestamp |
| `expirationDate` | Date | Yes | — | — | Must represent the medicine's expiration date; expired listings are excluded from public search |

**Availability/quantity consistency contract:**

- `quantity > 0` → `inStock = true`
- `quantity = 0` → `inStock = false`
- Negative quantities are invalid.

The service layer is responsible for enforcing this cross-field business invariant. The Mongoose schema provides field-level validation but must not be the only place responsible for the cross-field rule.

**Expiration contract:** Expired records are not physically deleted. Public medicine search/results must exclude listings whose `expirationDate` has been reached. Authorized administrative/business logic may still access the records where appropriate.

**`lastUpdated` contract:** `lastUpdated` is the user-facing freshness timestamp for medicine inventory information. It should be updated when the pharmacy changes information relevant to availability/price/inventory freshness. `updatedAt` remains the general database modification timestamp and is not a substitute for `lastUpdated` in the public trust indicator.

**Indexes:** An index on `pharmacyId` is justified for pharmacy-specific inventory management and report relationship checks. Search indexes for `medicineName`/`genericName` should be selected during implementation according to the actual search implementation; no external search technology is prescribed by this architecture.

**Uniqueness:** No global unique constraint should be placed on medicine name or generic name because different pharmacies must be able to maintain their own listing for the same medicine. A pharmacy-specific uniqueness rule for identical listings is not imposed here because the specification does not define what constitutes a duplicate medicine listing.

### 1.4 Report

| Field | Type | Required | Default | Relationship | Constraints / validation |
|---|---|---:|---|---|---|
| `_id` | ObjectId | Yes (MongoDB) | MongoDB-generated | — | Unique by MongoDB |
| `medicineId` | ObjectId | Yes | — | Reference to `Medicine._id` | Referenced medicine listing must exist when creating a report |
| `pharmacyId` | ObjectId | Yes | — | Reference to `Pharmacy._id` | Must correspond to the pharmacy owning `medicineId` |
| `reason` | String/enum | Yes | — | — | Must be one of: medicine unavailable, wrong price, wrong location, pharmacy permanently closed, expired medicines, other |
| `additionalComment` | String | No | — | — | Optional additional context |
| `status` | String/enum | Yes | Pending | — | Initial status is `Pending`; implementation must define only statuses needed to represent report review/action |
| `createdAt` | Date | Yes | Mongoose timestamps | — | Creation timestamp |

**Relationship consistency:** `Report.pharmacyId` must equal the `pharmacyId` of the referenced `Medicine`. The service layer must verify this relationship before accepting a report or any update that could make it inconsistent.

**Indexes:** Indexes on `medicineId`, `pharmacyId`, and `status` are justified for pharmacy/admin report review and filtering. No additional index is required until query patterns are known.

### 1.5 Schema-level responsibilities

Mongoose schemas should enforce:

- required fields
- primitive data types
- enum constraints where explicitly defined by the specification
- non-negative quantity
- valid basic email format
- timestamp fields
- references to the correct model types

Cross-document and business rules belong in services, especially:

- report `medicineId` ↔ `pharmacyId` consistency
- `quantity` ↔ `inStock` consistency
- expired listing exclusion from public search
- pharmacy ownership checks
- authorization-sensitive operations

## 2. API Contracts

The API is domain-oriented and is grouped into Authentication, Medicines, Pharmacies, Reports, and Admin. These are contracts only; no endpoints are implemented by this document.

### API conventions

- Base prefix: `/api`
- JSON request/response bodies unless a future specification explicitly requires another representation.
- Authentication is supplied through `Authorization: Bearer <JWT>` for protected requests.
- Visitor medicine search/details, pharmacy details, and report creation are public unless otherwise stated below.
- IDs in paths are MongoDB ObjectId values.

### 2.1 Authentication

| Method | Path | Purpose | Role | Path params | Query params | Request body | Success response | Errors |
|---|---|---|---|---|---|---|---|---|
| POST | `/api/auth/pharmacy/register` | Register a pharmacy account | Public | — | — | Pharmacy registration fields including pharmacy profile data and password; password is converted to `passwordHash` | `201` with created pharmacy/auth-safe user data; never return passwordHash | `400` validation; `409` duplicate authentication identity; `500` server |
| POST | `/api/auth/pharmacy/login` | Authenticate a pharmacy | Public | — | — | `email`, `password` | `200` with JWT and authenticated pharmacy identity/role | `400` validation; `401` invalid credentials; `500` server |
| POST | `/api/auth/admin/login` | Authenticate an admin | Public | — | — | `email`, `password` | `200` with JWT and authenticated admin identity/role | `400` validation; `401` invalid credentials; `500` server |

**Logout:** No server logout endpoint is required by the specification. JWT logout is a client-side token removal operation unless a future security requirement explicitly introduces server-side token revocation.

### 2.2 Medicines

| Method | Path | Purpose | Role | Path params | Query params | Request body | Success response | Errors |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/medicines` | Search medicine listings for visitors | Public | — | Medicine search term; optional generic-name search input; optional parameters needed for the unresolved nearby/distance contract only after that contract is resolved | — | `200` matching non-expired medicine listings with pharmacy information needed by the visitor experience, including price, quantity/availability, lastUpdated, expirationDate, open/closed status, phone, and Google Maps link as applicable | `400` invalid query; `500` server |
| GET | `/api/medicines/:id` | View a medicine listing's details | Public | `id` | — | — | `200` medicine listing details and associated pharmacy information required by the visitor experience | `400` invalid id; `404` not found/publicly unavailable; `500` server |
| POST | `/api/pharmacies/me/medicines` | Add a medicine/inventory listing for the authenticated pharmacy | Pharmacy | — | — | Medicine fields owned by the pharmacy | `201` created medicine listing | `400` validation; `401` authentication; `403` authorization; `404` pharmacy not found; `500` server |
| PATCH | `/api/pharmacies/me/medicines/:id` | Edit a pharmacy-owned medicine listing | Pharmacy | `id` | — | Editable medicine/inventory fields | `200` updated medicine listing | `400` validation; `401`; `403` ownership/role; `404`; `500` |
| DELETE | `/api/pharmacies/me/medicines/:id` | Delete a pharmacy-owned medicine listing | Pharmacy | `id` | — | — | `200`/`204` successful deletion | `401`; `403`; `404`; `500` |

**Public search contract:** Expired listings must not be returned. Availability and price comparison are properties of the individual pharmacy-specific listings returned by the search.

**Pharmacy ownership contract:** A pharmacy may modify/delete only its own medicine listings.

### 2.3 Pharmacies

| Method | Path | Purpose | Role | Path params | Query params | Request body | Success response | Errors |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/pharmacies/:id` | View pharmacy details as a visitor | Public | `id` | — | — | `200` public pharmacy information, including name, phone, address, Google Maps link, hours, logo where present, and current open/closed status | `400` invalid id; `404` not found; `500` server |
| GET | `/api/pharmacies/me` | Retrieve authenticated pharmacy profile | Pharmacy | — | — | — | `200` current pharmacy profile; never return passwordHash | `401`; `403`; `404`; `500` |
| PATCH | `/api/pharmacies/me` | Update authenticated pharmacy profile | Pharmacy | — | — | Pharmacy profile fields permitted by the specification | `200` updated profile; never return passwordHash | `400`; `401`; `403`; `404`; `500` |
| GET | `/api/pharmacies/me/dashboard` | Retrieve the pharmacy dashboard data required by the specification | Pharmacy | — | — | — | `200` total medicines, in-stock medicines, out-of-stock medicines, reports submitted by users, and recent inventory updates | `401`; `403`; `404`; `500` |

No public pharmacy-list endpoint is mandated independently of medicine search by the specification. Public pharmacy discovery is supported through medicine results and direct pharmacy details.

### 2.4 Reports

| Method | Path | Purpose | Role | Path params | Query params | Request body | Success response | Errors |
|---|---|---|---|---|---|---|---|---|
| POST | `/api/reports` | Submit a report about incorrect medicine/pharmacy information | Public | — | — | `medicineId`, `pharmacyId`, `reason`, optional `additionalComment` | `201` created report with safe public response data | `400` validation/relationship mismatch; `404` medicine/pharmacy not found; `500` server |
| GET | `/api/pharmacies/me/reports` | View reports submitted about the authenticated pharmacy's listings | Pharmacy | — | Optional review/status filtering only if needed by the dashboard contract | — | `200` reports associated with the pharmacy | `401`; `403`; `404`; `500` |
| GET | `/api/admin/reports` | Review reports across the platform | Admin | — | Optional `status`, `pharmacyId`, `medicineId` filters | — | `200` report list | `401`; `403`; `400` invalid filters; `500` |
| PATCH | `/api/admin/reports/:id` | Record the admin's report-review decision/action | Admin | `id` | — | The allowed report review status/action represented by the implementation contract | `200` updated report | `400`; `401`; `403`; `404`; `500` |

The report API must preserve the `medicineId` ↔ `pharmacyId` relationship.

### 2.5 Admin

| Method | Path | Purpose | Role | Path params | Query params | Request body | Success response | Errors |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/admin/dashboard` | View platform statistics and overall system-health information required by the specification | Admin | — | — | — | `200` platform statistics/system-health data required by the admin dashboard | `401`; `403`; `500` |
| GET | `/api/admin/pharmacies` | Manage/review pharmacies | Admin | — | Optional filters needed for management status | — | `200` pharmacy management data | `401`; `403`; `400`; `500` |
| PATCH | `/api/admin/pharmacies/:id/status` | Suspend, ban, or otherwise change a pharmacy's administrative status when required | Admin | `id` | — | The administrative status/action | `200` updated pharmacy management state | `400`; `401`; `403`; `404`; `500` |
| DELETE | `/api/admin/pharmacies/:id` | Remove a fake/inappropriate pharmacy from the platform when admin action requires removal | Admin | `id` | — | — | `200`/`204` successful removal | `401`; `403`; `404`; `500` |
| DELETE | `/api/admin/medicines/:id` | Remove an inappropriate medicine listing | Admin | `id` | — | — | `200`/`204` successful removal | `401`; `403`; `404`; `500` |

**Admin service boundary:** Admin endpoints must not duplicate medicine, pharmacy, or report domain logic. Admin-specific orchestration may call the corresponding domain services.

### 2.6 Endpoint contract notes

The endpoint list intentionally does not include:

- visitor registration/login
- visitor accounts
- visitor profile endpoints
- orders/cart/payment endpoints
- ratings/reviews
- delivery
- chat
- future features listed in the specification
- external Google Maps API endpoints
- distance-provider endpoints
- notification-provider endpoints
- expiration scheduler endpoints
- admin registration

Those are not required by the specification or are explicitly unresolved/future concerns.

## 3. Standard API Response Format

The entire backend uses one JSON envelope for application responses.

### Success

```json
{
  "success": true,
  "data": {},
  "message": "Human-readable success message"
}
```

- `success`: always `true` for successful responses.
- `data`: response payload. It may be an object, array, or `null` where appropriate.
- `message`: concise success description.

### Error

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

`details` is an array of structured validation/error details when useful and otherwise may be empty.

### Required HTTP/error categories

| HTTP status | Contract |
|---|---|
| `400` | Invalid request, query, path parameter, or validation failure |
| `401` | Missing/invalid/expired authentication credentials or invalid login credentials |
| `403` | Authenticated user lacks the required role or ownership permission |
| `404` | Requested resource does not exist or is not available to the requesting public surface |
| `409` | Resource conflicts with a uniqueness/authentication constraint |
| `500` | Unexpected server-side failure |

The frontend must consume this envelope consistently and must not depend on endpoint-specific response shapes.

## 4. Authentication Contract

### Pharmacy registration

1. Public client submits required pharmacy registration/profile information and a password.
2. Backend validates the request.
3. Backend stores only the secure password representation in `Pharmacy.passwordHash`.
4. PasswordHash is never returned to the frontend.
5. Registration creates the pharmacy identity required for later login.

### Pharmacy login

- Input: `email`, `password`.
- Backend verifies the credentials.
- Successful login returns a JWT and authenticated identity/role information.
- Invalid credentials return `401` using the standard error envelope.

### Admin login

- Input: `email`, `password`.
- Backend verifies the admin credentials stored in the Admin credential field.
- Successful login returns a JWT and admin identity/role information.
- There is no admin registration endpoint because provisioning is unresolved by the specification.

### JWT payload

The JWT must contain only the minimum identity/authorization claims required by the application. The required role claim is:

```text
role: "pharmacy" | "admin"
```

The token must also identify the authenticated account through an identifier claim. The exact claim name (`sub`, `userId`, etc.) is a shared implementation contract and must be agreed before coding; `sub` is the preferred conventional representation but is not mandated by the product specification.

No password, passwordHash, or sensitive profile data belongs in the JWT.

### Token handling

- Protected frontend requests send the JWT as `Authorization: Bearer <token>`.
- Backend authentication middleware verifies the token before protected controller execution.
- The frontend stores/manages the token according to the agreed client-side security approach; this architecture does not prescribe a storage technology beyond requiring that the token not be exposed as application data to unrelated components.
- Backend authorization is authoritative.

### Protected routes

- Public visitor routes require no JWT.
- Pharmacy management routes require a valid JWT with `role = pharmacy` and, where applicable, ownership of the target pharmacy resource.
- Admin routes require a valid JWT with `role = admin`.

### Role authorization

Role authorization occurs on the backend after JWT verification. Frontend route protection is a UX/navigation guard, not a security boundary.

### Logout

JWT logout is client-side token removal. No server logout/revocation endpoint is required by the specification. If a future security requirement introduces revocation, it must be added as an explicit architecture change.

## 5. Validation Conventions

Validation is divided by responsibility to avoid unnecessary duplication.

### Route-level validation

Routes define which validation middleware applies to a request. Routes do not contain business rules.

### Validation middleware

Validation middleware validates request shape before controller execution, including:

- required request fields
- basic field formats
- path parameter format
- query parameter format
- allowed enum values
- basic numeric constraints such as non-negative quantity

It should return the standard `400` response envelope on validation failure.

### Controllers

Controllers should not contain reusable business rules. They:

1. receive the validated request,
2. identify the authenticated actor where applicable,
3. call the appropriate service,
4. translate the service result into the standard response envelope.

### Services

Services enforce application/domain rules, including:

- pharmacy ownership
- quantity/inStock consistency
- report medicine/pharmacy relationship consistency
- public exclusion of expired medicine listings
- admin actions
- authentication orchestration
- expiration orchestration
- notification requests through the notification boundary

### Mongoose schemas

Schemas enforce persistence-level structure and field validation:

- required fields
- primitive types
- enum values
- non-negative numeric fields
- timestamps
- basic field formatting where appropriate
- references

Mongoose validation must not be relied upon for authorization or cross-document business rules.

## 6. Domain Responsibilities

### Routes

Routes define HTTP paths, HTTP methods, middleware ordering, and controller mapping. They contain no business logic.

### Controllers

Controllers are request/response adapters. They should remain thin and should not perform database queries or domain decision-making directly.

### Services

Services own domain/application operations and business rules. They coordinate models and other services where necessary.

### Models

Models define MongoDB/Mongoose persistence structures and field-level validation. Models do not decide who is authorized to perform an operation.

### Middleware

Middleware handles cross-cutting concerns:

- JWT authentication
- role authorization
- request validation
- not-found handling
- centralized error handling

### Utils

Utilities contain narrow, reusable helpers that do not own domain workflows. Examples already established by the architecture are date handling, pharmacy-status calculation, and Google Maps shared-link handling.

The backend pharmacy-status calculation is authoritative. Utilities must not become an alternative service layer.

## 7. Frontend/Backend Boundary

The normal data flow is:

`Page → Service → API client → Backend route → Controller → Service → Model/database`

### Frontend pages

Pages compose screens and user flows. They should not contain raw HTTP requests or backend business rules.

### Frontend services

Frontend services are responsible for:

- calling the corresponding backend API domain
- serializing request data according to the API contract
- parsing the standard API response envelope
- exposing typed results/errors to pages/components

Frontend services must **not**:

- query MongoDB
- implement authorization rules
- duplicate backend business logic
- calculate authoritative pharmacy open/closed status
- decide whether an expired medicine is publicly searchable
- implement server-side quantity/inStock rules
- call an external provider directly when that interaction belongs behind the backend boundary

### API client

`frontend/src/utils/api.ts` is the shared HTTP client/configuration boundary. Domain services use it rather than independently creating inconsistent HTTP configuration.

### Backend

The backend owns authentication, authorization, data validation at the domain boundary, business rules, persistence, and external-service abstraction boundaries.

## 8. Two-Developer Collaboration Contract

Bloom-Care is being developed by two developers. The architecture does not assign either developer to a specific domain. The developers should agree on domain ownership before implementation begins.

### Shared infrastructure

These areas are shared and should be modified deliberately:

- `docs/ARCHITECTURE.md`
- root `.gitignore`
- frontend application entry/routing composition (`frontend/src/App.tsx`, `frontend/src/main.tsx`, `frontend/src/routes/`)
- backend application entry/configuration (`backend/src/app.js`, `backend/src/server.js`, `backend/src/config/`)
- shared API client configuration (`frontend/src/utils/api.ts`)
- shared authentication context/hooks where changes affect both roles

### Domain-owned areas

Domain work should normally be isolated to the relevant areas:

- medicine-related components/pages/services/types
- pharmacy-related components/pages/services/types
- report-related components/pages/services/types
- admin-related pages/services
- corresponding backend controllers/services/routes/models

A developer should avoid modifying another developer's domain files unless the change is necessary for a shared contract or integration.

### Contract-sensitive areas

The following must be agreed before parallel feature implementation:

- API response format
- authentication/JWT format
- database relationships
- validation conventions
- error response format
- environment variables
- naming conventions

Changes to these contracts require communication between both developers before merging dependent work.

### Collaboration rules

1. Work from feature/domain branches rather than directly developing on the shared main branch.
2. Keep commits focused on one architectural/domain concern.
3. Do not silently change an API response shape used by another domain.
4. Do not change a shared model relationship without informing the other developer.
5. Do not duplicate a service because another developer owns a related controller; use the established domain boundary.
6. Keep environment secrets out of Git and use the agreed environment-variable contract.
7. Review contract-sensitive changes before merging dependent feature work.

## 9. Unresolved Decisions

The following requirements are explicit in the product specification but do not contain enough implementation detail to select a concrete mechanism. They remain intentionally unresolved.

### 9.1 Nearby pharmacy distance calculation

Required user-facing behavior includes nearby pharmacies and displayed distances such as `1 km away` and `2 km away`.

Specified pharmacy input remains a Google Maps shared link. The architecture is:

`Google Maps shared link → location resolution → usable location → distance calculation → displayed distance`

No latitude/longitude input fields are added and no external location/distance provider is selected yet.

### 9.2 Notification delivery mechanism

The system must notify the affected pharmacy and admin when medicine expiration is detected. The specification does not state whether delivery is email, SMS, push, or another mechanism.

`expiration.service.js` may request a notification through `notification.service.js`, but the delivery provider remains undecided.

### 9.3 Expiration scheduling mechanism

Automatic expiration processing is required, but the specification does not select cron, a worker, a cloud scheduler, or another mechanism. `expiration.service.js` remains the architectural boundary; no scheduler is established yet.

### 9.4 Admin provisioning

The specification defines an Admin model and admin login but does not define how the first/admin accounts are created or provisioned. No admin registration endpoint is established.

### 9.5 Emergency number

The navigation must expose an emergency call feature, but the actual emergency number is not supplied by the specification. The number must be provided before implementation of the call action.

## 10. Remaining Contradictions and Ambiguities in the Original Specification

### Pharmacy credential field

The specification requires pharmacy registration/login but the Pharmacy field list does not include a password field. The architecture resolves this technical contradiction by adding `passwordHash` as the minimum necessary credential field.

### Admin credential representation

The Admin field list includes `password`, but it does not explicitly say whether the value is plaintext or hashed. Secure implementation must treat it as a secure stored credential representation; no plaintext password storage is permitted.

### Nearby/distance data

The specification requires nearby pharmacies and displayed distances but only defines Google Maps shared-link input. It does not define how the system obtains a usable location or calculates distance.

### Notification channel

Expiration notifications are required, but their delivery mechanism is unspecified.

### Expiration trigger

Automatic expiration is required, but the execution/scheduling mechanism is unspecified.

### Report status values/actions

The specification requires a `status` field and describes admin decisions such as removing listings, warning pharmacies, suspending accounts, and banning pharmacies, but it does not define an exact status enum or state-transition model. Implementation must agree on the minimal status/action representation before coding.

### Pharmacy open/closed time semantics

Opening and closing times are required, but the specification does not define the exact time format or behavior for overnight schedules. The implementation contract must agree on the time representation before coding.

### Search semantics

The specification requires medicine search and generic-name search but does not define exact matching, partial matching, case sensitivity, ranking, or pagination behavior. Those details must be agreed before implementing search without changing the product requirement.

### Public result shape

The specification lists the information visitors should see but does not define an exact API payload shape. This document establishes one global response envelope; the exact medicine-result object fields should follow the database/specification fields and be finalized by the developers before implementation.

### Image storage

Cloudinary is marked optional in the technology stack, while pharmacy logo upload is part of the Pharmacy requirements. The exact storage mechanism for the optional logo is therefore not selected by this architecture contract.

## Explicit Non-Goals for This Stage

The following remain unimplemented:

- authentication
- CRUD operations
- API endpoint implementation
- database queries
- medicine search implementation
- distance calculation
- notification delivery
- expiration execution
- report handling
- UI functionality
- business logic
- background scheduler/job
- external service integration
- future features listed by the specification

# Bloom-Care Production Readiness Checklist

Use this before promoting to real production traffic.

## 1. Environment and secrets
- [ ] Set `NODE_ENV=production` on the backend host
- [ ] Set `MONGODB_URI` to a production MongoDB connection string
- [ ] Set `JWT_SECRET` to a strong random secret
- [ ] Set `CORS_ORIGIN` to the exact frontend origin, no trailing slash
- [ ] Set Cloudinary production credentials:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `CLOUDINARY_AUTH_TOKEN_KEY`
- [ ] Ensure no secrets are committed to Git
- [ ] Store secrets in the hosting provider secret manager or equivalent

## 2. Security hardening
- [ ] Confirm HTTPS is enforced on all frontend and backend URLs
- [ ] Verify Helmet is active in production
- [ ] Confirm CORS is restricted to the approved frontend origin(s)
- [ ] Review all admin routes for authorization correctness
- [ ] Verify pharmacy-only routes cannot be accessed by other roles
- [ ] Review all file-upload routes for size limits and content validation
- [ ] Audit for XSS and unsafe DOM rendering patterns
- [ ] Replace token storage with a more secure session strategy if policy requires it

## 3. Deployment safety
- [ ] Validate production env vars at startup
- [ ] Confirm backend health endpoint returns success on deployed instance
- [ ] Confirm the app fails fast if required production config is missing
- [ ] Check DB connectivity and startup logs in the host dashboard
- [ ] Verify that failed MongoDB connection does not silently start a broken app

## 4. Monitoring and observability
- [ ] Configure application monitoring (Sentry, Logtail, Datadog, or equivalent)
- [ ] Configure HTTP uptime monitoring and alerting
- [ ] Review structured logs for backend startup, auth failures, DB errors, and upload failures
- [ ] Configure alerts for 5xx responses, auth spikes, DB failures, and Cloudinary failures
- [ ] Define a dashboard for request volume, error rate, and latency

## 5. Backups and recoverability
- [ ] Set up MongoDB backups and recovery testing
- [ ] Define database restore procedure
- [ ] Define disaster recovery steps for Cloudinary and app deployment rollback
- [ ] Test a rollback procedure for a bad deployment

## 6. Quality gates
- [ ] CI runs on every PR and main branch
- [ ] Backend tests run as required checks
- [ ] Frontend build runs as required checks
- [ ] No direct deploy to production without a successful CI run

## 7. Operational readiness
- [ ] Define who is responsible for incidents
- [ ] Define escalation path for failed login, database outage, or Cloudinary outage
- [ ] Document rollback steps and emergency contact plan
- [ ] Confirm there is a staging environment matching production closely

## 8. Privacy and content review
- [ ] Review data retention for uploaded license documents
- [ ] Confirm only authorized users can view sensitive documents
- [ ] Review admin-only document URL expiration policy
- [ ] Confirm user-facing API responses do not leak internal fields

## 9. Final launch check
- [ ] Sign-off from app owner
- [ ] Sign-off from security review
- [ ] Run a final smoke test against deployed frontend and backend
- [ ] Verify public search, login, registration, admin access, and medicine flows
- [ ] Verify the production health endpoint is green
- [ ] Monitor for 30-60 minutes after launch

# ArclivoLabs Tech

Independent technology portfolio and project-enquiry website.

## Local setup

1. Install the dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Configure `MONGODB_URI` with a MongoDB database URI and set `AUTH_SECRET` to a unique random value. For example, generate one with:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
   ```

4. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 14 characters for the one-time initial account setup.
5. Run `npm run admin:seed` once. The seed command refuses to create another account when an administrator already exists. Remove `ADMIN_PASSWORD` from the runtime environment after initialization.
6. Start the website with `npm run dev`. The private admin sign-in is at `/admin/login`.

The admin password is stored as an Argon2id hash. Never commit `.env.local` or production credentials.

## Production notes

- Configure `MONGODB_URI` and `AUTH_SECRET` as server-only environment variables. Set `AUTH_URL` to the canonical `https://tech.arclivolabs.com` URL.
- Set `AUTH_TRUST_HOST=true` only when the app is behind a trusted ingress that validates the host and overwrites or appends client IP forwarding headers. Rate limits use a keyed digest of the forwarded client address; the raw address is not stored.
- Mongoose uses its driver defaults for connection pooling because deployment size and concurrency are not specified. Review Atlas connection metrics as traffic grows before changing pool settings.
- Enquiry and rate-limit collections use Mongoose-managed indexes. Ensure the deployment role can create the declared indexes on first startup.
- Admin pages and APIs are session-protected and marked non-indexable. The contact route stores only project-enquiry data and does not send email or automatic messages.

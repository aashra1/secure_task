# SecureTask

## Local HTTPS with mkcert

Generate and trust a local certificate once:

```bash
./scripts/setup-https.sh
```

Start the API and frontend in separate terminals:

```bash
cd backend && npm run dev
cd frontend && npm start
```

Then open <https://localhost:3001>. The API is available at
<https://localhost:3000>.

The local environment should contain:

```dotenv
# backend/.env
FRONTEND_URL=https://localhost:3001
HTTPS_CERT_PATH=../certs/localhost.pem
HTTPS_KEY_PATH=../certs/localhost-key.pem
CAPTCHA_SITE_KEY=your_recaptcha_v3_site_key
CAPTCHA_SECRET_KEY=your_recaptcha_v3_secret_key
CAPTCHA_MIN_SCORE=0.5
GOOGLE_CLIENT_ID=your_google_oauth_web_client_id

# frontend/.env
VITE_API_URL=https://localhost:3000/api
```

The reCAPTCHA keys belong in `backend/.env`. The public site key is provided
to the browser through `/api/auth/captcha-config`; the secret key never leaves
the API.

For Google sign-in, create a Web application OAuth client in Google Cloud and
add the frontend origins (for example, `https://localhost:3001`) under
Authorized JavaScript origins. Only `GOOGLE_CLIENT_ID` is required for the
Google Identity Services ID-token flow; no client secret is sent to the browser.

Generated private keys and certificates under `certs/` are ignored by Git.

## Docker with HTTPS

After generating and trusting the certificate, build and start the stack:

```bash
./scripts/setup-https.sh
docker compose up --build
```

Open <https://localhost:3001>. Nginx terminates HTTPS and proxies `/api`
requests to the backend over Docker's private network. Docker Compose also
starts a local MongoDB instance and persists its data in the
`securetask-mongo-data` volume.

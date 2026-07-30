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

# frontend/.env
VITE_API_URL=https://localhost:3000/api
```

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

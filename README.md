 # PDF Upload Service

Simple Express service for uploading PDFs with Bearer token authentication and serving them directly from `public/` folder.

## Features
- Bearer token authentication
- PDF-only uploads (25MB max)
- Direct file access via static URLs
- Files saved as `latest.pdf` (overwrites previous)
- Docker support with Bun runtime

## Endpoints
- `POST /api/upload` (multipart/form-data)
  - Header: `Authorization: Bearer <TOKEN>`
  - Field: `file` (PDF only)
  - Response: `{ id, url }`
- `GET /latest.pdf` direct access to the uploaded file

## Environment Variables (`.env`)
```bash
UPLOAD_TOKEN=your_secure_token_here
```

## Local Development
```bash
# Install dependencies
bun install

# Start server
bun run app.js
```

Upload a PDF:
```bash
curl -F "file=@/path/to/file.pdf;type=application/pdf" \
     -H "Authorization: Bearer $UPLOAD_TOKEN" \
     http://localhost:3000/api/upload
```

## Docker
```bash
# Build and run
docker build -t pdf-service .
docker run -d --name pdf-service --restart unless-stopped \
  -p 80:3000 \
  --env-file .env \
  -v $(pwd)/public:/app/public \
  pdf-service
```

## Docker Compose
```bash
# Set your token in .env first
docker compose up -d --build
```

## Production Notes
- Set `UPLOAD_TOKEN` to a secure random value (256+ bits)
- Files are overwritten on each upload (single file storage)

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

docker compose up -d --build

## Production Usage

1. **Clone the repository:**
  ```sh
  git clone <this-repo-url>
  cd PDF-Upload-Service
  ```

2. **Read the `.env.example` file and create your own `.env` file:**
  - Copy `.env.example` to `.env`.
  - Set the `UPLOAD_TOKEN` value in your `.env` file.

3. **Build and start the service:**
  ```sh
  docker compose up -d --build
  ```

4. **Access the service:**
  - The process will be available on port `6789`.
  - You can access it via `http://localhost:6789` or your server's public IP/domain.

---
**Notes:**
- Set `UPLOAD_TOKEN` to a secure random value (256+ bits)
- Files are overwritten on each upload (single file storage)

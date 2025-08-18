 # PDF Upload Service

Simple Express service for uploading PDFs with Bearer token authentication and serving them directly from `public/` folder.

## Features
- Bearer token authentication
- PDF-only uploads (25MB max)
- Direct file access via static URLs
- Files saved as `latest.pdf` (overwrites previous)
- Docker support with Bun runtime

## Endpoints

- `POST /cv/upload` (multipart/form-data)
  - Header: `Authorization: Bearer <TOKEN>`
  - Field: `file` (PDF only)
  - Response: `{ latest, versioned, version }`
- `GET /cv/latest.pdf` direct access to the latest uploaded file
- `GET /cv/v-<major>.<minor>.<patch>.pdf` access to a specific version


## How to generate a secure token

To generate a secure random token for `UPLOAD_TOKEN`, run the following command in your terminal:

```sh
openssl rand -hex 32
```

Copy the output and set it in your `.env` file:

```env
UPLOAD_TOKEN=your_generated_token_here
```

## Environment Variables (`.env`)
```bash
UPLOAD_TOKEN=your_secure_token_here
```

docker compose up -d --build
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
  http://localhost:3000/cv/upload
```

## Docker Compose

```bash
docker compose up -d --build
```

## Production Usage

1. **Clone the repository:**
  ```sh
  git clone <this-repo-url>
  cd pdf_view
  ```

2. **Create your `.env` file:**
  - Copy `.env.example` to `.env` (if present) or create `.env` manually.
  - Set the `UPLOAD_TOKEN` value in your `.env` file. For better security, use a long, random value:
    ```sh
    openssl rand -hex 32
    ```

3. **Build and start the service:**
  ```sh
  docker compose up -d --build
  ```

4. **Access the service:**
  - The service will be available on port `6789` (mapped to container port 3000).
  - Access via `http://localhost:6789/cv/latest.pdf` or upload via `http://localhost:6789/cv/upload`.

---
**Notes:**
- Set `UPLOAD_TOKEN` to a secure random value (256+ bits)
- Each upload overwrites `latest.pdf` and creates a new versioned file in `public/`
- The `/cv` route is used for all endpoints and static file access

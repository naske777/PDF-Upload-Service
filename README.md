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

This project uses Docker Compose to orchestrate both the PDF service and the nginx reverse proxy. Both services communicate over a shared Docker network.

### Docker Network

- The `docker-compose.yml` file specifies an external network named `pdf-service-network`:
  ```yaml
  networks:
    pdf-service-network:
      external: true
      name: pdf-service-network
  ```
- This allows the `pdf-service` and `nginx` containers to communicate securely by name (e.g., `proxy_pass http://pdf-service:3000/cv/` in nginx).
- **You must create this network before running Docker Compose for the first time:**

```sh
docker network create pdf-service-network
```

Then you can start the stack:

```sh
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

---

## Troubleshooting

### 1. Server does not start or crashes
- Check that you have installed all dependencies with `bun install`.
- Make sure your `.env` file exists and contains a valid `UPLOAD_TOKEN`.
- If using Docker, ensure the image builds successfully and ports are not in use.

### 2. Upload returns `401 Unauthorized`
- Confirm you are sending the correct `Authorization: Bearer <TOKEN>` header.
- Make sure the token matches the value in your `.env` file.

### 3. Upload returns `413 Payload Too Large`
- The file exceeds the 25MB limit. Only PDFs up to 25MB are accepted.

### 4. PDF not accessible at `/cv/latest.pdf` or versioned URL
- Check that the upload was successful and the file exists in the `public/` directory.
- If using Docker, verify that the volume is correctly mounted (`./public:/app/public`).

### 5. Page title does not show version when viewing PDF
- Make sure you are accessing the PDF via a browser at `/cv/latest.pdf` or `/cv/v-<version>.pdf`.
- If you download the file or open it directly as a PDF, the browser may not show the custom title.

### 6. Changes to `.env` are not reflected
- Restart the server or Docker container after modifying environment variables.


---

## Nginx Reverse Proxy & Cloudflare Setup

This project includes an example `nginx.conf` for secure reverse proxying and domain management.

### Example Nginx Configuration

See the provided `nginx.conf` for a full working example. Key points:

- Redirects all HTTP traffic to HTTPS.
- Only allows access via your configured domains (e.g., `cv.luilver.com`).
- Proxies `/cv/` requests to the backend service (e.g., Docker container `pdf-service:3000`).
- Limits upload size (see `client_max_body_size`).
- Uses Let's Encrypt certificates for SSL.

#### How to use
1. Place `nginx.conf` in your server's `/etc/nginx/` or appropriate config directory.
2. Adjust `server_name`, certificate paths, and proxy_pass as needed for your setup.
3. Reload or restart nginx after changes: `sudo systemctl reload nginx`


### Generating SSL Certificates with Let's Encrypt

You must generate the SSL certificates on the host machine (not inside the nginx container). The Docker Compose file mounts the host's `/etc/letsencrypt` directory into the nginx container so it can access the certificates.

You can use [Certbot](https://certbot.eff.org/) to generate free SSL certificates on your host:

```sh
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d cv.luilver.com -d luilver.com
```

This will automatically configure SSL and renewals. Certificates are stored in `/etc/letsencrypt/live/<your-domain>/` on the host.

**Important:**
- The volume line in `docker-compose.yml`:
  ```yaml
  - /etc/letsencrypt:/etc/letsencrypt:ro
  ```
  means the nginx container can read the certificates generated on the host at the same path. Do not generate certificates inside the container.

### Cloudflare DNS Setup

To use Cloudflare as a proxy and DNS provider:

1. Add your domain to Cloudflare and set the nameservers as instructed by Cloudflare.
2. In the Cloudflare dashboard, go to the DNS section and add an "A" record for your domain (e.g., `cv.luilver.com`) pointing to your server's public IP address.
3. (Recommended) Enable the orange cloud (proxy) for DDoS protection and caching.
4. In SSL/TLS settings, set the mode to "Full (strict)" for best security.
5. Make sure ports 80 and 443 are open on your server and not blocked by a firewall.

#### Tips
- If you use Cloudflare proxy, SSL must be enabled on your server (see above).
- For Let's Encrypt to work, temporarily disable the orange cloud (set to DNS only) while issuing/renewing certificates, then re-enable proxying.
- Use Cloudflare Page Rules or Firewall Rules for additional access control if needed.

---

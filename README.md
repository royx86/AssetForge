# AssetForge
AssetForge is a full-stack image asset platform built with **Node.js**, **Express**, **React**, **Sharp**, **MongoDB (Mongoose)**, and **AWS S3**. It provides project-scoped asset management for a dashboard and an API-key protected external API.

---

## Architecture & Flow

```text
Upload Image
      ↓
Validate (MIME & Sharp)
      ↓
Extract Metadata (Width, Height, Format, Size)
      ↓
Store Original in S3 (`original/:assetId/:filename`)
      ↓
Process with Sharp:
  • WebP (max 1200px width, quality 80)
  • AVIF (max 1200px width, quality 65)
  • Thumbnail (300 × 300, fit cover)
      ↓
Store Processed Images in S3 (`processed/`, `thumbnails/`)
      ↓
Save Metadata in MongoDB
      ↓
Return Asset Details & Image URLs
```

---

## Tech Stack

* **Runtime:** Node.js (CommonJS, plain JavaScript)
* **Framework:** Express.js
* **Image Processing Engine:** Sharp
* **Database:** MongoDB via Mongoose
* **Object Storage:** AWS S3 (`@aws-sdk/client-s3` & `@aws-sdk/s3-request-presigner`)
* **File Uploads:** Multer (in-memory buffering for zero unnecessary disk I/O)
* **Configuration:** dotenv
* **Containerization:** Docker & Docker Compose

## Engineering Notes

### Project isolation

Project resources are queried with the authenticated user ID. API keys resolve to one project, and external asset queries remain scoped to that project.

### Storage lifecycle

S3 stores image bytes while MongoDB stores metadata and object keys. Originals, generated variants, and on-demand transforms are tracked together so deletion removes all associated objects. Uploads roll back S3 objects when metadata persistence fails.

### Authentication and API access

Dashboard requests use JWT authentication. External requests use one-way hashed API keys, per-key rate limiting, and request logging. Raw API keys are returned only when they are created.

### Image processing

Uploads are held in memory, validated with Sharp, and converted into WebP, AVIF, and thumbnail variants before metadata is stored. Dynamic transforms are generated on demand and recorded for cleanup.

---

## Project Structure

```text
.
├── frontend/                     # React dashboard
├── src/
│   ├── server.js                  # Express application setup & error handling
│   │
│   ├── config/
│   │   ├── db.js                  # MongoDB Mongoose connection
│   │   └── s3.js                  # AWS S3 client configuration
│   │
│   ├── models/
│   │   └── Asset.js               # MongoDB Asset schema & indexes
│   │
│   ├── routes/
│   │   └── asset.routes.js        # Express API routes
│   │
│   ├── controllers/
│   │   └── asset.controller.js    # Request handlers for asset operations
│   │
│   └── services/
│       ├── storage.service.js     # S3 operations (upload, delete, URLs, signed URLs)
│       └── image.service.js       # Sharp processing (variants, transform, metadata)
│
├── uploads/                       # Working directory for local uploads
├── test/
│   ├── run-tests.js               # Asset lifecycle integration suite
│   └── platform-features.test.js  # Platform integration suite
├── .env                           # Local environment configuration (ignored)
├── .env.example                   # Environment variable template
├── .gitignore
├── package.json
├── Dockerfile
└── docker-compose.yml
```

---

## Getting Started

### 1. Prerequisites
- Node.js (>= 18.x or 20.x/22.x)
- MongoDB instance (or Docker)
- AWS S3 bucket and credentials (or local S3-compatible service like MinIO/LocalStack)

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your `.env` variables:

```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/assetforge

AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-bucket-name

# Optional (for MinIO, LocalStack, or custom S3-compatible endpoints):
# AWS_ENDPOINT=http://localhost:9000
# AWS_S3_FORCE_PATH_STYLE=true

JWT_SECRET=replace_with_a_random_secret_at_least_32_characters
JWT_EXPIRES_IN=7d
```

`JWT_SECRET` must be a random value with at least 32 characters. Use a comma-separated `CORS_ORIGIN` value when the dashboard is hosted separately from the API.

### 3. Installation

```bash
npm install
```

### 4. Running the Application

#### Development mode:
```bash
npm run dev
```

#### Production mode:
```bash
npm start
```

### 5. Running with Docker Compose

To spin up both the Node.js API and MongoDB in containers:

```bash
docker compose up --build
```

---

## Automated 17-Step Verification Tests

AssetForge includes a self-contained integration test suite that tests the exact 17-step workflow (using an in-memory MongoDB and local S3 server):

```bash
npm test
```

This verifies:
1. MongoDB connection
2. Server startup
3. Image upload via multipart/form-data
4. S3 original key existence
5. S3 WebP variant generation (max 1200px)
6. S3 AVIF variant generation (max 1200px)
7. S3 Thumbnail variant generation (300x300 cover)
8. MongoDB metadata document verification
9. `GET /api/assets/:id` metadata and URL resolution
10. HTTP retrieval of returned image URLs
11. Dynamic image transformation (`POST /api/assets/:id/transform`)
12. Retrieval of transformed image
13. Listing assets with pagination
14. Filtering by folder and tag
15. Asset deletion (`DELETE /api/assets/:id`)
16. Deletion of all S3 files (no orphaned files)
17. Deletion of MongoDB document
18. *Bonus:* Private signed URL generation & error handling

---

## API Reference & cURL Examples

### 1. Upload an Image
- **Endpoint:** `POST /api/assets`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `file` (required): Image file (JPEG, PNG, WebP, AVIF)
  - `folder` (optional): Folder name (e.g. `products`)
  - `tags` (optional): Comma-separated tags (e.g. `electronics,featured`)
  - `visibility` (optional): `public` (default) or `private`

```bash
curl -X POST http://localhost:5000/api/assets \
  -F "file=@product.jpg" \
  -F "folder=products" \
  -F "tags=electronics,featured" \
  -F "visibility=public"
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "originalName": "product.jpg",
    "mimeType": "image/jpeg",
    "size": 245821,
    "format": "jpeg",
    "folder": "products",
    "tags": ["electronics", "featured"],
    "visibility": "public",
    "original": {
      "key": "original/abc123/product.jpg",
      "url": "https://bucket.s3.ap-south-1.amazonaws.com/original/abc123/product.jpg",
      "width": 1920,
      "height": 1080
    },
    "webp": {
      "key": "processed/abc123/product.webp",
      "url": "https://bucket.s3.ap-south-1.amazonaws.com/processed/abc123/product.webp",
      "width": 1200,
      "height": 675
    },
    "avif": {
      "key": "processed/abc123/product.avif",
      "url": "https://bucket.s3.ap-south-1.amazonaws.com/processed/abc123/product.avif",
      "width": 1200,
      "height": 675
    },
    "thumbnail": {
      "key": "thumbnails/abc123/product.webp",
      "url": "https://bucket.s3.ap-south-1.amazonaws.com/thumbnails/abc123/product.webp",
      "width": 300,
      "height": 300
    },
    "createdAt": "2026-09-28T08:00:00.000Z",
    "updatedAt": "2026-09-28T08:00:00.000Z"
  }
}
```

---

### 2. Get Asset Details & URLs
- **Endpoint:** `GET /api/assets/:id`

```bash
curl -X GET http://localhost:5000/api/assets/64f1a2b3c4d5e6f7a8b9c0d1
```

---

### 3. Dynamic Image Transformation
- **Endpoint:** `POST /api/assets/:id/transform`
- **Content-Type:** `application/json`
- **Body parameters:**
  - `width` (optional, positive integer)
  - `height` (optional, positive integer)
  - `format` (optional, `webp`, `avif`, `jpeg`, `png`)
  - `quality` (optional, 1-100, default: 80)
  - `fit` (optional, `cover`, `contain`, `fill`, `inside`, `outside`, default: `cover`)

```bash
curl -X POST http://localhost:5000/api/assets/64f1a2b3c4d5e6f7a8b9c0d1/transform \
  -H "Content-Type: application/json" \
  -d '{
    "width": 800,
    "height": 600,
    "format": "webp",
    "quality": 75,
    "fit": "cover"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "url": "https://bucket.s3.ap-south-1.amazonaws.com/transformed/64f1a2b3c4d5e6f7a8b9c0d1/1700000000_800x600.webp",
    "key": "transformed/64f1a2b3c4d5e6f7a8b9c0d1/1700000000_800x600.webp",
    "width": 800,
    "height": 600,
    "format": "webp",
    "size": 45120
  }
}
```

---

### 4. List Assets (with Pagination & Filters)
- **Endpoint:** `GET /api/assets`
- **Query parameters:**
  - `page` (default: 1)
  - `limit` (default: 20, max: 100)
  - `folder` (filter by folder)
  - `tag` (filter by tag)
  - `visibility` (filter by `public` or `private`)

```bash
# Basic pagination
curl -X GET "http://localhost:5000/api/assets?page=1&limit=20"

# Filter by folder
curl -X GET "http://localhost:5000/api/assets?folder=products"

# Filter by tag
curl -X GET "http://localhost:5000/api/assets?tag=featured"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [ /* Array of asset objects */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

### 5. Generate Pre-signed Temporary URL (Private Assets)
- **Endpoint:** `GET /api/assets/:id/url`
- **Query parameters:**
  - `variant` (optional: `original`, `webp`, `avif`, `thumbnail`, default: `original`)
  - `expiresIn` (optional: seconds, default: 3600)

```bash
curl -X GET "http://localhost:5000/api/assets/64f1a2b3c4d5e6f7a8b9c0d1/url?variant=thumbnail&expiresIn=1800"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "url": "https://bucket.s3.ap-south-1.amazonaws.com/thumbnails/abc123/product.webp?X-Amz-Algorithm=...",
    "expiresIn": 1800
  }
}
```

---

### 6. Delete Asset
- **Endpoint:** `DELETE /api/assets/:id`
- Deletes the original image, all processed variants (WebP, AVIF, Thumbnail) from S3, and removes the document from MongoDB.

```bash
curl -X DELETE http://localhost:5000/api/assets/64f1a2b3c4d5e6f7a8b9c0d1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Asset deleted successfully",
    "id": "64f1a2b3c4d5e6f7a8b9c0d1"
  }
}
```

---

## Error Handling

All API errors return a consistent structure:

```json
{
  "success": false,
  "error": {
    "message": "Asset not found"
  }
}
```

HTTP Status Codes used:
- `400 Bad Request`: Validation failure, missing file, unsupported format, invalid transformation parameters
- `404 Not Found`: Asset not found or unrecognized endpoint
- `413 Payload Too Large`: Uploaded file exceeds file size limit
- `500 Internal Server Error`: Unhandled server/infrastructure exceptions

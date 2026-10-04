import React, { useState } from 'react';
import { MethodBadge } from '../components/common/Badge';
import {
  Copy,
  Check,
  Code2,
  Server
} from 'lucide-react';

const endpoints = [
  {
    id: 'auth',
    title: 'Authentication',
    method: 'HEADER',
    endpoint: 'Authorization: Bearer <API_KEY>',
    description:
      'All external v1 API requests must include your project API key in the Authorization header. You can also provide the key using the x-api-key header.',
    headers: {
      Authorization: 'Bearer ak_live_xxxxxxxxxxxxxxxxxxxxxxxx'
    },
    js: `const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.assetforge.com/api/v1',
  headers: { Authorization: 'Bearer YOUR_API_KEY' }
});`
  },
  {
    id: 'upload',
    title: 'Upload Asset',
    method: 'POST',
    endpoint: '/api/v1/assets',
    description:
      'Uploads an image file to AWS S3 and automatically triggers Sharp to generate WebP, AVIF, and 300x300 thumbnail variants.',
    headers: {
      Authorization: 'Bearer YOUR_API_KEY',
      'Content-Type': 'multipart/form-data'
    },
    body: `file: <binary image file (JPEG, PNG, WebP, AVIF)>
folder: "products" (optional)
tags: "phone, electronics" (optional)
visibility: "public" | "private" (optional, default: "public")`,
    response: `{
  "success": true,
  "data": {
    "id": "673f8a...",
    "originalName": "product.jpg",
    "mimeType": "image/jpeg",
    "size": 245100,
    "format": "jpeg",
    "folder": "products",
    "tags": ["phone", "electronics"],
    "visibility": "public",
    "original": {
      "url": "https://bucket.s3.../original/.../product.jpg",
      "width": 1920,
      "height": 1080
    },
    "webp": {
      "url": "https://bucket.s3.../processed/.../product.webp",
      "width": 1200,
      "height": 675
    },
    "avif": {
      "url": "https://bucket.s3.../processed/.../product.avif",
      "width": 1200,
      "height": 675
    },
    "thumbnail": {
      "url": "https://bucket.s3.../thumbnails/.../product.webp",
      "width": 300,
      "height": 300
    }
  }
}`,
    js: `const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream('./product.jpg'));
form.append('folder', 'products');
form.append('tags', 'phone, electronics');

const res = await client.post('/assets', form, {
  headers: form.getHeaders()
});
console.log(res.data);`
  },
  {
    id: 'get',
    title: 'Get Asset',
    method: 'GET',
    endpoint: '/api/v1/assets/:id',
    description:
      'Retrieves metadata and fresh CDN/S3 URLs for an asset by its unique MongoDB identifier.',
    headers: {
      Authorization: 'Bearer YOUR_API_KEY'
    },
    response: `{
  "success": true,
  "data": {
    "id": "673f8a...",
    "originalName": "product.jpg",
    "original": { "url": "..." },
    "webp": { "url": "..." },
    "avif": { "url": "..." },
    "thumbnail": { "url": "..." }
  }
}`,
    js: `const res = await client.get('/assets/673f8a...');
console.log(res.data);`
  },
  {
    id: 'list',
    title: 'List Assets',
    method: 'GET',
    endpoint: '/api/v1/assets',
    description:
      'Lists assets belonging to the project. Supports pagination, folder, tag, and search query filters.',
    headers: {
      Authorization: 'Bearer YOUR_API_KEY'
    },
    queryParams: `page: 1 (default: 1)
limit: 20 (default: 20, max: 100)
folder: "products" (optional)
tag: "featured" (optional)
search: "banner" (optional)`,
    response: `{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1284,
    "pages": 65
  }
}`,
    js: `const res = await client.get('/assets', {
  params: { page: 1, limit: 20, folder: 'products' }
});
console.log(res.data);`
  },
  {
    id: 'transform',
    title: 'Transform Image',
    method: 'POST',
    endpoint: '/api/v1/assets/:id/transform',
    description:
      'Dynamically resizes, crops, and re-encodes an asset into any supported format with Sharp.',
    headers: {
      Authorization: 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: `{
  "width": 800,
  "height": 600,
  "format": "webp",
  "quality": 80,
  "fit": "cover"
}`,
    response: `{
  "success": true,
  "data": {
    "url": "https://bucket.s3.../transformed/.../179059_800x600.webp",
    "key": "transformed/.../179059_800x600.webp",
    "width": 800,
    "height": 600,
    "format": "webp",
    "size": 34200
  }
}`,
    js: `const res = await client.post('/assets/673f8a.../transform', {
  width: 800,
  height: 600,
  format: 'webp',
  quality: 80,
  fit: 'cover'
});
console.log(res.data.data.url);`
  },
  {
    id: 'signed-url',
    title: 'Generate Signed URL',
    method: 'GET',
    endpoint: '/api/v1/assets/:id/url',
    description:
      'Generates a time-limited AWS S3 pre-signed URL for direct, secure client-side download.',
    headers: {
      Authorization: 'Bearer YOUR_API_KEY'
    },
    queryParams: `variant: "original" | "webp" | "avif" | "thumbnail" (default: "original")
expiresIn: 3600 (seconds, max: 604800)`,
    response: `{
  "success": true,
  "data": {
    "url": "https://bucket.s3.amazonaws.com/original/...?X-Amz-Signature=...",
    "expiresIn": 3600
  }
}`,
    js: `const res = await client.get('/assets/673f8a.../url', {
  params: { variant: 'original', expiresIn: 3600 }
});
console.log(res.data.data.url);`
  },
  {
    id: 'delete',
    title: 'Delete Asset',
    method: 'DELETE',
    endpoint: '/api/v1/assets/:id',
    description:
      'Permanently deletes the original file, all Sharp variants from S3, and removes the document from MongoDB.',
    headers: {
      Authorization: 'Bearer YOUR_API_KEY'
    },
    response: `{
  "success": true,
  "data": {
    "message": "Asset deleted successfully",
    "id": "673f8a..."
  }
}`,
    js: `const res = await client.delete('/assets/673f8a...');
console.log(res.data);`
  }
];

export default function ApiDocs() {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-900">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          API Integration Documentation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete guide for integrating AssetForge into your Node.js, Python, or client applications
        </p>
      </div>

      {/* Quick Start Callout */}
      <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-slate-700 space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <Server className="w-4 h-4 text-[#ec7211]" />
          <span>Base API URL & Rate Limits</span>
        </div>
        <p className="text-slate-600">
          All external v1 endpoints are served at{' '}
          <code className="bg-white px-2 py-0.5 rounded border border-amber-200 text-slate-900 font-mono font-semibold">
            /api/v1
          </code>
          . API keys have an automatic sliding window rate limit of{' '}
          <strong className="text-slate-900">100 requests per minute</strong>.
        </p>
      </div>

      {/* Endpoints List */}
      <div className="space-y-6">
        {endpoints.map((ep) => (
          <div
            key={ep.id}
            id={ep.id}
            className="p-5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-4"
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <MethodBadge method={ep.method} />
                <code className="text-xs sm:text-sm font-semibold font-mono text-slate-900">
                  {ep.endpoint}
                </code>
              </div>
              <h2 className="text-sm font-bold text-slate-900">{ep.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{ep.description}</p>
            </div>

            {/* Request Details */}
            {(ep.headers || ep.body || ep.queryParams) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {ep.headers && (
                  <div className="p-3 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                      Required Headers
                    </span>
                    <pre className="font-mono text-slate-800 whitespace-pre-wrap text-[11px]">
                      {Object.entries(ep.headers)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join('\n')}
                    </pre>
                  </div>
                )}

                {ep.body && (
                  <div className="p-3 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                      Request Body
                    </span>
                    <pre className="font-mono text-slate-800 whitespace-pre-wrap text-[11px]">
                      {ep.body}
                    </pre>
                  </div>
                )}

                {ep.queryParams && (
                  <div className="p-3 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                      Query Parameters
                    </span>
                    <pre className="font-mono text-slate-800 whitespace-pre-wrap text-[11px]">
                      {ep.queryParams}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Code Examples: Node.js / JavaScript */}
            <div className="space-y-3">
              <div className="rounded-md bg-[#0f172a] border border-slate-800 overflow-hidden shadow-inner">
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#161e2e] border-b border-slate-800 text-xs">
                  <span className="font-mono text-slate-300 flex items-center gap-1.5 font-medium">
                    <Code2 className="w-3.5 h-3.5 text-[#ec7211]" /> Node.js / JavaScript
                  </span>
                  <button
                    onClick={() => handleCopy(ep.js, `${ep.id}-js`)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-100 transition-colors"
                  >
                    {copiedId === `${ep.id}-js` ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === `${ep.id}-js` ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3.5 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre">
                  {ep.js}
                </pre>
              </div>
            </div>

            {/* Example Response */}
            {ep.response && (
              <div className="rounded-md bg-slate-50 border border-slate-200 overflow-hidden">
                <div className="px-3.5 py-1.5 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                  Response (JSON)
                </div>
                <pre className="p-3.5 text-xs font-mono text-slate-800 overflow-x-auto whitespace-pre">
                  {ep.response}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

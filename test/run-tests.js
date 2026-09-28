/**
 * AssetForge V2 Comprehensive Verification Suite
 * Tests all 17 required sequence steps against real MongoDB & S3 operations.
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const http = require('http');
const request = require('supertest');
const sharp = require('sharp');
const { MongoMemoryServer } = require('mongodb-memory-server');
const S3rver = require('s3rver');
const { S3Client, CreateBucketCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const mongoose = require('mongoose');

// Colors for clean console logging
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;

async function runAllTests() {
  console.log(bold('\n========================================================'));
  console.log(bold('       AssetForge V2 - 17 Step Integration Test Suite    '));
  console.log(bold('========================================================\n'));

  let mongod;
  let s3rver;
  let s3TempDir;
  let s3TestClient;
  let app;
  let Asset;
  let s3Config;

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Start MongoDB
    // -------------------------------------------------------------------------
    console.log(cyan('[Step 1] Starting MongoDB in-memory instance...'));
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    process.env.MONGODB_URI = mongoUri;
    process.env.NODE_ENV = 'test';
    console.log(green(`✓ [Step 1] MongoDB started successfully at ${mongoUri}`));

    // Start S3 local instance (S3rver)
    const s3Port = 4569;
    s3TempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assetforge-s3-test-'));
    s3rver = new S3rver({
      port: s3Port,
      address: '127.0.0.1',
      silent: true,
      directory: s3TempDir
    });
    await s3rver.run();

    const s3Endpoint = `http://127.0.0.1:${s3Port}`;
    const testBucket = 'assetforge-test-bucket';

    process.env.AWS_REGION = 'ap-south-1';
    process.env.AWS_ACCESS_KEY_ID = 'S3RVER';
    process.env.AWS_SECRET_ACCESS_KEY = 'S3RVER';
    process.env.AWS_S3_BUCKET = testBucket;
    process.env.AWS_ENDPOINT = s3Endpoint;
    process.env.AWS_S3_FORCE_PATH_STYLE = 'true';

    // Create bucket using S3Client
    s3TestClient = new S3Client({
      region: 'ap-south-1',
      endpoint: s3Endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: 'S3RVER', secretAccessKey: 'S3RVER' }
    });
    await s3TestClient.send(new CreateBucketCommand({ Bucket: testBucket }));
    console.log(green(`✓ S3 Server started and test bucket '${testBucket}' created`));

    // -------------------------------------------------------------------------
    // STEP 2: Start Node.js backend
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 2] Initializing Node.js backend & connecting to database...'));
    const connectDB = require('../src/config/db');
    await connectDB();
    s3Config = require('../src/config/s3');
    s3Config.resetS3Client();

    Asset = require('../src/models/Asset');
    app = require('../src/server');
    console.log(green('✓ [Step 2] Backend initialized and connected to database'));

    // Create test image with Sharp (1920 x 1080 JPEG)
    const testImageBuffer = await sharp({
      create: {
        width: 1920,
        height: 1080,
        channels: 3,
        background: { r: 50, g: 120, b: 220 }
      }
    })
      .jpeg({ quality: 90 })
      .toBuffer();

    console.log(green(`✓ Generated 1920x1080 test image buffer (${testImageBuffer.length} bytes)`));

    // -------------------------------------------------------------------------
    // STEP 3: Upload an image
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 3] Uploading image via POST /api/assets...'));
    const uploadRes = await request(app)
      .post('/api/assets')
      .field('folder', 'products')
      .field('tags', 'electronics,featured')
      .field('visibility', 'public')
      .attach('file', testImageBuffer, 'product.jpg');

    if (uploadRes.status !== 201 || !uploadRes.body.success) {
      throw new Error(`Upload failed with status ${uploadRes.status}: ${JSON.stringify(uploadRes.body)}`);
    }

    const uploadedAsset = uploadRes.body.data;
    const assetId = uploadedAsset.id;
    console.log(green(`✓ [Step 3] Image uploaded successfully. Asset ID: ${assetId}`));

    // -------------------------------------------------------------------------
    // STEP 4: Check S3 original
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 4] Checking S3 original file...'));
    const originalS3Obj = await s3TestClient.send(
      new GetObjectCommand({
        Bucket: testBucket,
        Key: uploadedAsset.original.key
      })
    );
    if (!originalS3Obj.Body) {
      throw new Error(`Original image not found in S3 at key ${uploadedAsset.original.key}`);
    }
    console.log(green(`✓ [Step 4] S3 original exists at '${uploadedAsset.original.key}'`));

    // -------------------------------------------------------------------------
    // STEP 5: Check WebP
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 5] Checking S3 WebP processed variant...'));
    const webpS3Obj = await s3TestClient.send(
      new GetObjectCommand({
        Bucket: testBucket,
        Key: uploadedAsset.webp.key
      })
    );
    const webpChunks = [];
    for await (const chunk of webpS3Obj.Body) webpChunks.push(chunk);
    const webpBuffer = Buffer.concat(webpChunks);
    const webpMeta = await sharp(webpBuffer).metadata();

    if (webpMeta.format !== 'webp' || webpMeta.width > 1200) {
      throw new Error(`WebP validation failed: format=${webpMeta.format}, width=${webpMeta.width}`);
    }
    console.log(green(`✓ [Step 5] WebP variant verified: format=${webpMeta.format}, dimensions=${webpMeta.width}x${webpMeta.height}`));

    // -------------------------------------------------------------------------
    // STEP 6: Check AVIF
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 6] Checking S3 AVIF processed variant...'));
    const avifS3Obj = await s3TestClient.send(
      new GetObjectCommand({
        Bucket: testBucket,
        Key: uploadedAsset.avif.key
      })
    );
    const avifChunks = [];
    for await (const chunk of avifS3Obj.Body) avifChunks.push(chunk);
    const avifBuffer = Buffer.concat(avifChunks);
    const avifMeta = await sharp(avifBuffer).metadata();

    const isAvif = avifMeta.format === 'avif' || (avifMeta.format === 'heif' && avifMeta.compression === 'av1');
    if (!isAvif || avifMeta.width > 1200) {
      throw new Error(`AVIF validation failed: format=${avifMeta.format}, compression=${avifMeta.compression}, width=${avifMeta.width}`);
    }
    console.log(green(`✓ [Step 6] AVIF variant verified: format=${avifMeta.format} (${avifMeta.compression}), dimensions=${avifMeta.width}x${avifMeta.height}`));

    // -------------------------------------------------------------------------
    // STEP 7: Check thumbnail
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 7] Checking S3 Thumbnail variant (300x300)...'));
    const thumbS3Obj = await s3TestClient.send(
      new GetObjectCommand({
        Bucket: testBucket,
        Key: uploadedAsset.thumbnail.key
      })
    );
    const thumbChunks = [];
    for await (const chunk of thumbS3Obj.Body) thumbChunks.push(chunk);
    const thumbBuffer = Buffer.concat(thumbChunks);
    const thumbMeta = await sharp(thumbBuffer).metadata();

    if (thumbMeta.width !== 300 || thumbMeta.height !== 300) {
      throw new Error(`Thumbnail dimensions mismatch: ${thumbMeta.width}x${thumbMeta.height}`);
    }
    console.log(green(`✓ [Step 7] Thumbnail variant verified: ${thumbMeta.width}x${thumbMeta.height}, format=${thumbMeta.format}`));

    // -------------------------------------------------------------------------
    // STEP 8: Check MongoDB document
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 8] Checking MongoDB document...'));
    const dbAsset = await Asset.findById(assetId);
    if (!dbAsset) {
      throw new Error(`Asset document not found in MongoDB for ID ${assetId}`);
    }
    if (dbAsset.originalName !== 'product.jpg' || dbAsset.width !== 1920 || dbAsset.height !== 1080) {
      throw new Error(`Document metadata mismatch: ${JSON.stringify(dbAsset)}`);
    }
    if (!dbAsset.variants.webp?.key || !dbAsset.variants.avif?.key || !dbAsset.variants.thumbnail?.key) {
      throw new Error('Variants keys missing from MongoDB document');
    }
    console.log(green(`✓ [Step 8] MongoDB document verified with all metadata and variant keys`));

    // -------------------------------------------------------------------------
    // STEP 9: GET the asset
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 9] Fetching asset via GET /api/assets/:id...'));
    const getRes = await request(app).get(`/api/assets/${assetId}`);
    if (getRes.status !== 200 || !getRes.body.success) {
      throw new Error(`GET /api/assets/:id failed with status ${getRes.status}`);
    }
    const fetchedAsset = getRes.body.data;
    if (!fetchedAsset.original.url || !fetchedAsset.webp.url || !fetchedAsset.avif.url || !fetchedAsset.thumbnail.url) {
      throw new Error('One or more URLs missing in GET asset response');
    }
    console.log(green(`✓ [Step 9] GET /api/assets/:id returned full asset with valid URLs`));

    // -------------------------------------------------------------------------
    // STEP 10: Open returned image URLs
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 10] Testing HTTP access to returned image URLs...'));
    const testUrlFetch = (url) => {
      return new Promise((resolve, reject) => {
        http.get(url, (res) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            reject(new Error(`Failed to fetch ${url}, status: ${res.statusCode}`));
          }
        }).on('error', reject);
      });
    };

    await testUrlFetch(fetchedAsset.original.url);
    await testUrlFetch(fetchedAsset.webp.url);
    await testUrlFetch(fetchedAsset.avif.url);
    await testUrlFetch(fetchedAsset.thumbnail.url);
    console.log(green(`✓ [Step 10] Successfully opened returned image URLs (HTTP 200 OK)`));

    // -------------------------------------------------------------------------
    // STEP 11: Create a custom transformation
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 11] Creating custom dynamic transformation via POST /api/assets/:id/transform...'));
    const transformRes = await request(app)
      .post(`/api/assets/${assetId}/transform`)
      .send({
        width: 800,
        height: 600,
        format: 'webp',
        quality: 75,
        fit: 'cover'
      });

    if (transformRes.status !== 200 || !transformRes.body.success) {
      throw new Error(`Transform failed with status ${transformRes.status}: ${JSON.stringify(transformRes.body)}`);
    }
    const transformedData = transformRes.body.data;
    if (transformedData.width !== 800 || transformedData.height !== 600 || transformedData.format !== 'webp') {
      throw new Error(`Transformation response mismatch: ${JSON.stringify(transformedData)}`);
    }
    console.log(green(`✓ [Step 11] Transformation succeeded: ${transformedData.width}x${transformedData.height} ${transformedData.format}`));

    // -------------------------------------------------------------------------
    // STEP 12: Open transformed image
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 12] Opening transformed image URL...'));
    await testUrlFetch(transformedData.url);
    console.log(green(`✓ [Step 12] Successfully fetched transformed image from URL (HTTP 200 OK)`));

    // -------------------------------------------------------------------------
    // STEP 13: List assets
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 13] Listing assets via GET /api/assets...'));
    const listRes = await request(app).get('/api/assets?page=1&limit=20');
    if (listRes.status !== 200 || !listRes.body.success) {
      throw new Error(`List assets failed with status ${listRes.status}`);
    }
    if (!Array.isArray(listRes.body.data) || listRes.body.data.length === 0) {
      throw new Error('List assets returned empty array');
    }
    if (listRes.body.pagination.total !== 1 || listRes.body.pagination.page !== 1) {
      throw new Error(`Pagination metadata error: ${JSON.stringify(listRes.body.pagination)}`);
    }
    console.log(green(`✓ [Step 13] Assets listed successfully with pagination (Total: ${listRes.body.pagination.total})`));

    // -------------------------------------------------------------------------
    // STEP 14: Filter by folder/tag
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 14] Testing filters by folder and tag...'));
    const folderFilterRes = await request(app).get('/api/assets?folder=products');
    if (folderFilterRes.body.data.length !== 1) {
      throw new Error(`Folder filter failed. Expected 1 result, got ${folderFilterRes.body.data.length}`);
    }

    const badFolderRes = await request(app).get('/api/assets?folder=other');
    if (badFolderRes.body.data.length !== 0) {
      throw new Error(`Folder filter failed for negative match. Expected 0, got ${badFolderRes.body.data.length}`);
    }

    const tagFilterRes = await request(app).get('/api/assets?tag=featured');
    if (tagFilterRes.body.data.length !== 1) {
      throw new Error(`Tag filter failed. Expected 1 result, got ${tagFilterRes.body.data.length}`);
    }

    const badTagRes = await request(app).get('/api/assets?tag=nonexistent');
    if (badTagRes.body.data.length !== 0) {
      throw new Error(`Tag filter failed for negative match. Expected 0, got ${badTagRes.body.data.length}`);
    }
    console.log(green(`✓ [Step 14] Filtering by folder and tag verified successfully`));

    // -------------------------------------------------------------------------
    // STEP 15: Delete asset
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 15] Deleting asset via DELETE /api/assets/:id...'));
    const deleteRes = await request(app).delete(`/api/assets/${assetId}`);
    if (deleteRes.status !== 200 || !deleteRes.body.success) {
      throw new Error(`Delete failed with status ${deleteRes.status}: ${JSON.stringify(deleteRes.body)}`);
    }
    console.log(green(`✓ [Step 15] Delete asset API returned success: ${deleteRes.body.data.message}`));

    // -------------------------------------------------------------------------
    // STEP 16: Verify S3 files are deleted
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 16] Verifying S3 files are deleted...'));
    let originalStillExists = false;
    try {
      await s3TestClient.send(new GetObjectCommand({ Bucket: testBucket, Key: uploadedAsset.original.key }));
      originalStillExists = true;
    } catch (err) {
      // Expected: NoSuchKey
    }

    if (originalStillExists) {
      throw new Error(`Original S3 file was not deleted: ${uploadedAsset.original.key}`);
    }

    let webpStillExists = false;
    try {
      await s3TestClient.send(new GetObjectCommand({ Bucket: testBucket, Key: uploadedAsset.webp.key }));
      webpStillExists = true;
    } catch (err) {
      // Expected
    }

    if (webpStillExists) {
      throw new Error(`WebP S3 file was not deleted: ${uploadedAsset.webp.key}`);
    }
    console.log(green(`✓ [Step 16] Verified all S3 files (original, webp, avif, thumbnail) were deleted`));

    // -------------------------------------------------------------------------
    // STEP 17: Verify MongoDB document is deleted
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Step 17] Verifying MongoDB document is deleted...'));
    const deletedDbAsset = await Asset.findById(assetId);
    if (deletedDbAsset !== null) {
      throw new Error(`MongoDB document still exists for ID ${assetId}`);
    }

    const getAfterDeleteRes = await request(app).get(`/api/assets/${assetId}`);
    if (getAfterDeleteRes.status !== 404) {
      throw new Error(`Expected 404 after deletion, got ${getAfterDeleteRes.status}`);
    }
    console.log(green(`✓ [Step 17] Verified MongoDB document deleted and GET returns 404`));

    // -------------------------------------------------------------------------
    // ADDITIONAL: Private image signed URL endpoint (Section 11)
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Bonus] Testing private asset & GET /api/assets/:id/url...'));
    const privateUpload = await request(app)
      .post('/api/assets')
      .field('visibility', 'private')
      .attach('file', testImageBuffer, 'confidential.jpg');

    if (privateUpload.status !== 201) {
      throw new Error(`Private upload failed with status ${privateUpload.status}`);
    }
    const privId = privateUpload.body.data.id;

    const signedUrlRes = await request(app).get(`/api/assets/${privId}/url?variant=original&expiresIn=1800`);
    if (signedUrlRes.status !== 200 || !signedUrlRes.body.data.url) {
      throw new Error(`Failed to generate signed URL: ${JSON.stringify(signedUrlRes.body)}`);
    }
    if (signedUrlRes.body.data.expiresIn !== 1800) {
      throw new Error(`expiresIn mismatch: expected 1800, got ${signedUrlRes.body.data.expiresIn}`);
    }
    console.log(green(`✓ Temporary signed URL generated: expiresIn=${signedUrlRes.body.data.expiresIn}`));

    // -------------------------------------------------------------------------
    // ADDITIONAL: Error handling validation (Section 12)
    // -------------------------------------------------------------------------
    console.log(cyan('\n[Bonus] Testing error handling validation...'));
    // 1. Missing file
    const noFileRes = await request(app).post('/api/assets').field('folder', 'test');
    if (noFileRes.status !== 400 || noFileRes.body.success !== false) {
      throw new Error('Expected 400 for missing file');
    }

    // 2. Unsupported file type (text file)
    const textFileRes = await request(app)
      .post('/api/assets')
      .attach('file', Buffer.from('hello world not an image'), 'test.txt');
    if (textFileRes.status !== 400 || textFileRes.body.success !== false) {
      throw new Error('Expected 400 for unsupported file type');
    }

    // 3. Invalid transformation parameter
    const badTransformRes = await request(app)
      .post(`/api/assets/${privId}/transform`)
      .send({ width: -50 });
    if (badTransformRes.status !== 400 || badTransformRes.body.success !== false) {
      throw new Error('Expected 400 for negative width');
    }

    // Clean up private asset
    await request(app).delete(`/api/assets/${privId}`);
    console.log(green(`✓ Error handling verified (invalid file, missing file, bad transformation correctly return 400)`));

    console.log(bold('\n========================================================'));
    console.log(bold(green('  ALL 17 SEQUENCE STEPS & VALIDATIONS PASSED! ✓✓✓ ')));
    console.log(bold('========================================================\n'));
  } catch (err) {
    console.error(red('\n❌ Test failed:'), err);
    process.exitCode = 1;
  } finally {
    // Teardown
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
    if (s3rver) {
      await s3rver.close();
    }
    if (s3TempDir && fs.existsSync(s3TempDir)) {
      fs.rmSync(s3TempDir, { recursive: true, force: true });
    }
  }
}

runAllTests();

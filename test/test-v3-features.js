const os = require('os');
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const sharp = require('sharp');
const { MongoMemoryServer } = require('mongodb-memory-server');
const S3rver = require('s3rver');
const { S3Client, CreateBucketCommand } = require('@aws-sdk/client-s3');

const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;

async function runNewFeatureTests() {
  console.log(bold('\n========================================================'));
  console.log(bold('   AssetForge - Platform Integration Test Suite   '));
  console.log(bold('========================================================\n'));

  let mongod;
  let s3rver;
  let s3TempDir;

  try {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_key_12345678901234567890';

    const s3Port = 4570;
    s3TempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assetforge-v3-test-'));
    s3rver = new S3rver({
      port: s3Port,
      address: '127.0.0.1',
      silent: true,
      directory: s3TempDir
    });
    await s3rver.run();

    const s3Endpoint = `http://127.0.0.1:${s3Port}`;
    const testBucket = 'assetforge-v3-bucket';

    process.env.AWS_REGION = 'ap-south-1';
    process.env.AWS_ACCESS_KEY_ID = 'S3RVER';
    process.env.AWS_SECRET_ACCESS_KEY = 'S3RVER';
    process.env.AWS_S3_BUCKET = testBucket;
    process.env.AWS_ENDPOINT = s3Endpoint;
    process.env.AWS_S3_FORCE_PATH_STYLE = 'true';

    const s3TestClient = new S3Client({
      region: 'ap-south-1',
      endpoint: s3Endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: 'S3RVER', secretAccessKey: 'S3RVER' }
    });
    await s3TestClient.send(new CreateBucketCommand({ Bucket: testBucket }));

    const connectDB = require('../src/config/db');
    await connectDB();
    const s3Config = require('../src/config/s3');
    s3Config.resetS3Client();

    const app = require('../src/server');

    // 1. User Registration
    console.log(cyan('[Test 1] User Registration (POST /api/auth/register)...'));
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Developer Alice',
        email: 'alice@example.com',
        password: 'password123'
      });
    if (regRes.status !== 201 || !regRes.body.data.token) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
    }
    const authToken = regRes.body.data.token;
    console.log(green('✓ User registered and JWT token received'));

    // 2. User Login
    console.log(cyan('[Test 2] User Login (POST /api/auth/login)...'));
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'password123'
      });
    if (loginRes.status !== 200 || !loginRes.body.data.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }
    console.log(green('✓ User logged in successfully'));

    // 3. User Me Profile
    console.log(cyan('[Test 3] Get User Profile (GET /api/auth/me)...'));
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    if (meRes.status !== 200 || meRes.body.data.user.email !== 'alice@example.com') {
      throw new Error(`Get profile failed: ${JSON.stringify(meRes.body)}`);
    }
    console.log(green(`✓ Authenticated profile retrieved: ${meRes.body.data.user.name}`));

    // 4. Create Project
    console.log(cyan('[Test 4] Create Project (POST /api/projects)...'));
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E-commerce App',
        description: 'Production web store assets'
      });
    if (projRes.status !== 201 || !projRes.body.data.id) {
      throw new Error(`Create project failed: ${JSON.stringify(projRes.body)}`);
    }
    const projectId = projRes.body.data.id;
    console.log(green(`✓ Project created with ID: ${projectId}`));

    // 5. Create API Key
    console.log(cyan('[Test 5] Create API Key (POST /api/projects/:projectId/api-keys)...'));
    const keyRes = await request(app)
      .post(`/api/projects/${projectId}/api-keys`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Production Live Key' });
    if (keyRes.status !== 201 || !keyRes.body.data.rawKey) {
      throw new Error(`Create API key failed: ${JSON.stringify(keyRes.body)}`);
    }
    const rawApiKey = keyRes.body.data.rawKey;
    const apiKeyId = keyRes.body.data.apiKey.id;
    console.log(green(`✓ API key generated: ${rawApiKey.slice(0, 12)}... (id: ${apiKeyId})`));

    // 6. Test Image Buffer
    const testImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
      .jpeg()
      .toBuffer();

    // 6. Upload asset via project-scoped dashboard endpoint
    console.log(cyan('[Test 6] Upload via Project Route (POST /api/projects/:projectId/assets)...'));
    const uploadProjRes = await request(app)
      .post(`/api/projects/${projectId}/assets`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', testImageBuffer, 'project-banner.jpg')
      .field('folder', 'banners')
      .field('tags', 'hero, web');
    if (uploadProjRes.status !== 201 || !uploadProjRes.body.data.id) {
      throw new Error(`Project asset upload failed: ${JSON.stringify(uploadProjRes.body)}`);
    }
    const assetId1 = uploadProjRes.body.data.id;
    console.log(green(`✓ Uploaded asset to project. Asset ID: ${assetId1}`));

    // 7. Upload asset via External API key endpoint
    console.log(cyan('[Test 7] Upload via External API (POST /api/v1/assets)...'));
    const uploadV1Res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .attach('file', testImageBuffer, 'product-v1.jpg')
      .field('folder', 'catalog');
    if (uploadV1Res.status !== 201 || !uploadV1Res.body.data.id) {
      throw new Error(`External API upload failed: ${JSON.stringify(uploadV1Res.body)}`);
    }
    const assetId2 = uploadV1Res.body.data.id;
    console.log(green(`✓ Uploaded asset via API Key. Asset ID: ${assetId2}`));

    // 8. List assets via external API
    console.log(cyan('[Test 8] List assets via External API (GET /api/v1/assets)...'));
    const listV1Res = await request(app)
      .get('/api/v1/assets')
      .set('Authorization', `Bearer ${rawApiKey}`);
    if (listV1Res.status !== 200 || listV1Res.body.data.length < 2) {
      throw new Error(`List assets via API key failed: ${JSON.stringify(listV1Res.body)}`);
    }
    console.log(green(`✓ Listed ${listV1Res.body.data.length} assets for project via API Key`));

    // 9. Transform asset via external API
    console.log(cyan('[Test 9] Transform image via External API (POST /api/v1/assets/:id/transform)...'));
    const transRes = await request(app)
      .post(`/api/v1/assets/${assetId2}/transform`)
      .set('Authorization', `Bearer ${rawApiKey}`)
      .send({
        width: 400,
        height: 300,
        format: 'webp',
        quality: 85
      });
    if (transRes.status !== 200 || !transRes.body.data.url) {
      throw new Error(`Transform via API key failed: ${JSON.stringify(transRes.body)}`);
    }
    console.log(green(`✓ Transformed image URL received: ${transRes.body.data.url}`));

    // 10. Project usage stats
    console.log(cyan('[Test 10] Check Project Usage (GET /api/projects/:projectId/usage)...'));
    const usageRes = await request(app)
      .get(`/api/projects/${projectId}/usage`)
      .set('Authorization', `Bearer ${authToken}`);
    if (usageRes.status !== 200 || usageRes.body.data.assets !== 2) {
      throw new Error(`Usage stats incorrect: ${JSON.stringify(usageRes.body)}`);
    }
    console.log(green(`✓ Project usage: ${usageRes.body.data.assets} assets, ${usageRes.body.data.storageBytes} bytes, ${usageRes.body.data.apiRequests} requests`));

    // 11. Check API request logs
    console.log(cyan('[Test 11] Check API Request Logs (GET /api/projects/:projectId/logs)...'));
    // Small delay to allow async log finish
    await new Promise((r) => setTimeout(r, 200));
    const logsRes = await request(app)
      .get(`/api/projects/${projectId}/logs`)
      .set('Authorization', `Bearer ${authToken}`);
    if (logsRes.status !== 200 || logsRes.body.data.length === 0) {
      throw new Error(`API logs empty: ${JSON.stringify(logsRes.body)}`);
    }
    console.log(green(`✓ Recorded ${logsRes.body.data.length} API logs for project`));

    // 12. Revoke API key
    console.log(cyan('[Test 12] Revoke API Key (DELETE /api/projects/:projectId/api-keys/:id)...'));
    const revokeRes = await request(app)
      .delete(`/api/projects/${projectId}/api-keys/${apiKeyId}`)
      .set('Authorization', `Bearer ${authToken}`);
    if (revokeRes.status !== 200) {
      throw new Error(`Revoke API key failed: ${JSON.stringify(revokeRes.body)}`);
    }
    console.log(green('✓ API key revoked successfully'));

    // 13. Verify revoked API key is rejected
    console.log(cyan('[Test 13] Verify Revoked API Key rejected (GET /api/v1/assets)...'));
    const rejectedRes = await request(app)
      .get('/api/v1/assets')
      .set('Authorization', `Bearer ${rawApiKey}`);
    if (rejectedRes.status !== 401) {
      throw new Error(`Revoked key should be 401 but got: ${rejectedRes.status}`);
    }
    console.log(green('✓ Revoked API key correctly rejected with 401 Unauthorized'));

    console.log(bold('\n========================================================'));
    console.log(green('  ALL PLATFORM INTEGRATION TESTS PASSED! ✓✓✓ '));
    console.log(bold('========================================================\n'));

    process.exit(0);
  } catch (err) {
    console.error(red('\n❌ Test Suite Failed:'), err);
    process.exit(1);
  } finally {
    if (s3rver) {
      try {
        await s3rver.close();
      } catch (e) {}
    }
    if (s3TempDir) {
      try {
        fs.rmSync(s3TempDir, { recursive: true, force: true });
      } catch (e) {}
    }
    if (mongod) {
      try {
        await mongod.stop();
      } catch (e) {}
    }
  }
}

runNewFeatureTests();

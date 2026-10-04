const {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Config = require('../config/s3');

class StorageService {
  /**
   * Upload a file buffer to S3
   * @param {string} key - S3 object key
   * @param {Buffer} buffer - File buffer
   * @param {string} contentType - MIME type
   * @returns {Promise<{ key: string }>}
   */
  async upload(key, buffer, contentType) {
    const bucket = s3Config.BUCKET_NAME;
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType
    });

    await s3Config.s3Client.send(command);
    return { key };
  }

  /**
   * Delete an object from S3
   * @param {string} key - S3 object key
   * @returns {Promise<void>}
   */
  async delete(key) {
    const bucket = s3Config.BUCKET_NAME;
    if (!bucket || !key) return;

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });

    await s3Config.s3Client.send(command);
  }

  /**
   * Delete multiple objects from S3
   * @param {string[]} keys - List of S3 object keys
   * @returns {Promise<void>}
   */
  async deleteMany(keys) {
    const bucket = s3Config.BUCKET_NAME;
    if (!bucket || !Array.isArray(keys) || keys.length === 0) return;

    const validKeys = keys.filter(Boolean);
    if (validKeys.length === 0) return;

    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: validKeys.map((key) => ({ Key: key })),
        Quiet: true
      }
    });

    await s3Config.s3Client.send(command);
  }

  /**
   * Get an object buffer from S3 (used for transformations)
   * @param {string} key - S3 object key
   * @returns {Promise<Buffer>}
   */
  async getObjectBuffer(key) {
    const bucket = s3Config.BUCKET_NAME;
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const response = await s3Config.s3Client.send(command);
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Generate permanent public URL for an S3 key
   * @param {string} key - S3 object key
   * @returns {string}
   */
  generateUrl(key) {
    if (!key) return null;

    const bucket = s3Config.BUCKET_NAME;
    const endpoint = s3Config.AWS_ENDPOINT;
    const region = s3Config.AWS_REGION;

    if (endpoint) {
      const endpointClean = endpoint.replace(/\/+$/, '');
      return `${endpointClean}/${bucket}/${key}`;
    }

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  /**
   * Generate temporary pre-signed URL for an S3 key
   * @param {string} key - S3 object key
   * @param {number} expiresIn - Expiration time in seconds (default 3600)
   * @returns {Promise<string>}
   */
  async generateSignedUrl(key, expiresIn = 3600) {
    const bucket = s3Config.BUCKET_NAME;
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }
    if (!key) {
      throw new Error('S3 key is required to generate signed URL');
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    return getSignedUrl(s3Config.s3Client, command, {
      expiresIn: Number(expiresIn) || 3600
    });
  }
}

module.exports = new StorageService();

const { S3Client } = require('@aws-sdk/client-s3');

let cachedClient = null;

function createS3Client() {
  const region = process.env.AWS_REGION || 'ap-south-1';
  const clientConfig = { region };

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
  }

  if (process.env.AWS_ENDPOINT) {
    clientConfig.endpoint = process.env.AWS_ENDPOINT;
    clientConfig.forcePathStyle =
      process.env.AWS_S3_FORCE_PATH_STYLE === undefined ||
      process.env.AWS_S3_FORCE_PATH_STYLE === 'true';
  }

  return new S3Client(clientConfig);
}

function getS3Client() {
  if (!cachedClient) {
    cachedClient = createS3Client();
  }
  return cachedClient;
}

function resetS3Client() {
  cachedClient = null;
}

module.exports = {
  get s3Client() {
    return getS3Client();
  },
  get BUCKET_NAME() {
    return process.env.AWS_S3_BUCKET;
  },
  get AWS_REGION() {
    return process.env.AWS_REGION || 'ap-south-1';
  },
  get AWS_ENDPOINT() {
    return process.env.AWS_ENDPOINT;
  },
  getS3Client,
  resetS3Client
};

const crypto = require('crypto');

function generateApiKey(environment = 'live') {
  const prefix = environment === 'test' ? 'ak_test_' : 'ak_live_';
  const randomPart = crypto.randomBytes(24).toString('hex');
  const rawKey = `${prefix}${randomPart}`;

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const maskedKey = `${prefix}${'*'.repeat(20)}${rawKey.slice(-4)}`;

  return {
    rawKey,
    keyHash,
    maskedKey
  };
}

function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

module.exports = {
  generateApiKey,
  hashApiKey
};

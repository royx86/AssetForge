function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (
    !secret ||
    secret.length < 32 ||
    secret === 'your_jwt_secret_key_here' ||
    secret.startsWith('replace_with_')
  ) {
    throw new Error('JWT_SECRET must be configured with a random value of at least 32 characters');
  }

  return secret;
}

module.exports = { getJwtSecret };
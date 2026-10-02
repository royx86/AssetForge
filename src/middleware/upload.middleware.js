const multer = require('multer');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_BYTES, 10) || 25 * 1024 * 1024 // 25MB
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      const error = new Error(
        `Unsupported image format: ${file.mimetype}. Allowed formats: JPEG, PNG, WebP, AVIF`
      );
      error.statusCode = 400;
      return cb(error, false);
    }
    cb(null, true);
  }
});

module.exports = upload;

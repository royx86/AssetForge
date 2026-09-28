const sharp = require('sharp');

const SUPPORTED_INPUT_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'avif', 'heif'];
const SUPPORTED_OUTPUT_FORMATS = ['webp', 'avif', 'jpeg', 'png'];
const SUPPORTED_FIT_VALUES = ['cover', 'contain', 'fill', 'inside', 'outside'];

class ImageService {
  /**
   * Validate image buffer and extract core metadata using Sharp
   * @param {Buffer} buffer - Raw image buffer
   * @returns {Promise<{ width: number, height: number, format: string }>}
   */
  async validateAndExtractMetadata(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      const err = new Error('Invalid image buffer provided');
      err.statusCode = 400;
      throw err;
    }

    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (sharpError) {
      const err = new Error(`Sharp failed to parse image: ${sharpError.message}`);
      err.statusCode = 400;
      throw err;
    }

    let rawFormat = metadata.format ? metadata.format.toLowerCase() : '';
    let normalizedFormat = rawFormat;

    // Sharp/libvips reports AVIF as format 'heif' with compression 'av1'
    if (rawFormat === 'heif' && metadata.compression === 'av1') {
      normalizedFormat = 'avif';
    }

    if (!rawFormat || !SUPPORTED_INPUT_FORMATS.includes(rawFormat)) {
      const err = new Error(
        `Unsupported image format: ${metadata.format || 'unknown'}. Allowed formats: JPEG, PNG, WebP, AVIF`
      );
      err.statusCode = 400;
      throw err;
    }

    // Map 'jpg' -> 'jpeg'
    if (normalizedFormat === 'jpg') {
      normalizedFormat = 'jpeg';
    }

    return {
      width: metadata.width,
      height: metadata.height,
      format: normalizedFormat
    };
  }

  /**
   * Generate required variants: WebP (max 1200), AVIF (max 1200), and Thumbnail (300x300 cover)
   * @param {Buffer} buffer - Original image buffer
   * @returns {Promise<{ webp: object, avif: object, thumbnail: object }>}
   */
  async processVariants(buffer) {
    // 1. Process WebP variant (max width 1200px, quality 80)
    const webpPipeline = sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 });

    const [webpBuffer, webpInfo] = await Promise.all([
      webpPipeline.toBuffer(),
      webpPipeline.metadata()
    ]);

    // 2. Process AVIF variant (max width 1200px, reasonable quality: 65)
    const avifPipeline = sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .avif({ quality: 65 });

    const [avifBuffer, avifInfo] = await Promise.all([
      avifPipeline.toBuffer(),
      avifPipeline.metadata()
    ]);

    // 3. Process Thumbnail variant (300x300, fit: cover, format: webp)
    const thumbPipeline = sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 80 });

    const [thumbBuffer, thumbInfo] = await Promise.all([
      thumbPipeline.toBuffer(),
      thumbPipeline.metadata()
    ]);

    return {
      webp: {
        buffer: webpBuffer,
        width: webpInfo.width || 1200,
        height: webpInfo.height,
        format: 'webp',
        contentType: 'image/webp'
      },
      avif: {
        buffer: avifBuffer,
        width: avifInfo.width || 1200,
        height: avifInfo.height,
        format: 'avif',
        contentType: 'image/avif'
      },
      thumbnail: {
        buffer: thumbBuffer,
        width: thumbInfo.width || 300,
        height: thumbInfo.height || 300,
        format: 'webp',
        contentType: 'image/webp'
      }
    };
  }

  /**
   * Dynamically transform an image buffer according to query/body options
   * @param {Buffer} buffer - Source image buffer
   * @param {object} options - Transformation options (width, height, format, quality, fit)
   * @returns {Promise<{ buffer: Buffer, width: number, height: number, format: string, contentType: string, size: number }>}
   */
  async transform(buffer, options = {}) {
    let pipeline = sharp(buffer);

    const { width, height, format, quality, fit } = options;

    // Validate and apply fit
    let chosenFit = 'cover';
    if (fit) {
      const lowerFit = String(fit).toLowerCase();
      if (!SUPPORTED_FIT_VALUES.includes(lowerFit)) {
        const err = new Error(
          `Invalid fit value '${fit}'. Supported fit values: ${SUPPORTED_FIT_VALUES.join(', ')}`
        );
        err.statusCode = 400;
        throw err;
      }
      chosenFit = lowerFit;
    }

    // Validate and apply resize if width or height provided
    const parsedWidth = width ? parseInt(width, 10) : undefined;
    const parsedHeight = height ? parseInt(height, 10) : undefined;

    if (width !== undefined && (isNaN(parsedWidth) || parsedWidth <= 0)) {
      const err = new Error('Width must be a positive integer');
      err.statusCode = 400;
      throw err;
    }

    if (height !== undefined && (isNaN(parsedHeight) || parsedHeight <= 0)) {
      const err = new Error('Height must be a positive integer');
      err.statusCode = 400;
      throw err;
    }

    if (parsedWidth || parsedHeight) {
      pipeline = pipeline.resize({
        width: parsedWidth,
        height: parsedHeight,
        fit: chosenFit
      });
    }

    // Validate and apply format & quality
    const targetFormat = (format ? String(format).toLowerCase() : 'webp');
    if (!SUPPORTED_OUTPUT_FORMATS.includes(targetFormat)) {
      const err = new Error(
        `Invalid format '${format}'. Supported output formats: ${SUPPORTED_OUTPUT_FORMATS.join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    const parsedQuality = quality !== undefined ? parseInt(quality, 10) : 80;
    if (isNaN(parsedQuality) || parsedQuality < 1 || parsedQuality > 100) {
      const err = new Error('Quality must be an integer between 1 and 100');
      err.statusCode = 400;
      throw err;
    }

    switch (targetFormat) {
      case 'webp':
        pipeline = pipeline.webp({ quality: parsedQuality });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality: parsedQuality });
        break;
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality: parsedQuality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality: parsedQuality });
        break;
    }

    const outputBuffer = await pipeline.toBuffer();
    const finalMetadata = await sharp(outputBuffer).metadata();

    const mimeMap = {
      webp: 'image/webp',
      avif: 'image/avif',
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png'
    };

    return {
      buffer: outputBuffer,
      width: finalMetadata.width,
      height: finalMetadata.height,
      format: targetFormat === 'jpg' ? 'jpeg' : targetFormat,
      contentType: mimeMap[targetFormat] || 'application/octet-stream',
      size: outputBuffer.length
    };
  }
}

module.exports = new ImageService();

const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true
    },
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    format: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const assetSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true
    },
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    format: {
      type: String,
      required: true
    },
    originalKey: {
      type: String,
      required: true
    },
    variants: {
      webp: {
        type: variantSchema,
        required: true
      },
      avif: {
        type: variantSchema,
        required: true
      },
      thumbnail: {
        type: variantSchema,
        required: true
      }
    },
    transformed: {
      type: [variantSchema],
      default: []
    },
    folder: {
      type: String,
      default: null,
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying and listing
assetSchema.index({ folder: 1 });
assetSchema.index({ tags: 1 });
assetSchema.index({ visibility: 1 });
assetSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Asset', assetSchema);

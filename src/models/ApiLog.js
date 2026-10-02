const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiKey',
      default: null
    },
    method: {
      type: String,
      required: true
    },
    endpoint: {
      type: String,
      required: true
    },
    statusCode: {
      type: Number,
      required: true
    },
    responseTime: {
      type: Number,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

apiLogSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('ApiLog', apiLogSchema);

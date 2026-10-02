require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const connectDB = require('./config/db');
const assetRoutes = require('./routes/asset.routes');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const v1Routes = require('./routes/v1.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');
const fs = require('fs');
const frontendDist = path.join(__dirname, '../frontend/dist');
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'AssetForge API',
      version: '2.0.0',
      status: 'healthy'
    }
  });
});

app.get('/', (req, res) => {
  if (fs.existsSync(frontendDist)) {
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }

  res.status(200).json({
    success: true,
    data: {
      name: 'AssetForge API',
      version: '2.0.0',
      status: 'healthy'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/v1', v1Routes);
app.use('/api/assets', assetRoutes);

// Serve static frontend build if present
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api|\/health).*$/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route '${req.originalUrl}' not found`
    }
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Multer error handling
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'File too large. Maximum allowed size is 25MB';
    } else {
      statusCode = 400;
      message = `Upload error: ${err.message}`;
    }
  }

  // Mongoose validation or casting error handling
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Asset not found';
  }

  // S3 specific error handling
  if (err.name === 'NoSuchKey') {
    statusCode = 404;
    message = 'Requested file not found in storage';
  }

  // If status is still 500, log error stack in development
  if (statusCode === 500 && process.env.NODE_ENV !== 'test') {
    console.error('[Unhandled Server Error]:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message
    }
  });
});

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`[AssetForge] Server running on port ${PORT}`);
    });
  });
}

module.exports = app;

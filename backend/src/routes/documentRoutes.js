const express = require('express');
const { createDocumentController } = require('../controllers/documentController');

function createUploadRateLimiter(maxUploadsPerMinute) {
  const windowDurationMs = 60 * 1000;
  const uploadsByClient = new Map();

  return (req, res, next) => {
    const now = Date.now();
    for (const [clientId, window] of uploadsByClient) {
      if (now - window.startedAt >= windowDurationMs) uploadsByClient.delete(clientId);
    }

    const clientId = req.ip || req.socket.remoteAddress || 'unknown';
    let clientWindow = uploadsByClient.get(clientId);
    if (!clientWindow || now - clientWindow.startedAt >= windowDurationMs) {
      clientWindow = { startedAt: now, count: 0 };
      uploadsByClient.set(clientId, clientWindow);
    }

    if (clientWindow.count >= maxUploadsPerMinute) {
      return res.status(429).json({
        error: { code: 'UPLOAD_RATE_LIMITED', message: 'Limite de uploads atingido. Tente novamente em instantes.' }
      });
    }

    clientWindow.count += 1;
    next();
  };
}

function createDocumentRoutes({ service, uploadMiddleware, maxUploadsPerMinute }) {
  const router = express.Router();
  const controller = createDocumentController(service);
  const uploadRateLimiter = createUploadRateLimiter(maxUploadsPerMinute);

  router.post('/upload', uploadRateLimiter, uploadMiddleware, controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = { createDocumentRoutes };
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const { createDocumentRepository }  = require('./repositories/documentRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentRoutes } = require('./routes/documentRoutes');
const { createLocalFileRepository } = require('./repositories/localFileRepository');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_UPLOADS_PER_MINUTE = 30;

function createApp(options = {}) {
  const storageDir = path.resolve(
    options.storageDir ?? process.env.STORAGE_DIR ?? path.join(__dirname, '../storage')
  );
  const maxFileSizeBytes = Number(
    options.maxFileSizeBytes ?? process.env.MAX_FILE_SIZE_BYTES ?? DEFAULT_MAX_FILE_SIZE_BYTES
  );
  const maxUploadsPerMinute = Number(
    options.maxUploadsPerMinute ?? process.env.MAX_UPLOADS_PER_MINUTE ?? DEFAULT_MAX_UPLOADS_PER_MINUTE
  );
  const userId = options.userId ?? process.env.DMS_USER_ID ?? 'local-user';

  if (!Number.isSafeInteger(maxFileSizeBytes) || maxFileSizeBytes <= 0) {
    throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
  }
  if (!Number.isSafeInteger(maxUploadsPerMinute) || maxUploadsPerMinute <= 0) {
    throw new Error('MAX_UPLOADS_PER_MINUTE deve ser um inteiro positivo.');
  }

  const repository = createDocumentRepository();
  const fileRepository = createLocalFileRepository({ storageDir, maxFileSizeBytes });
  const service = createDocumentService({ repository, fileRepository });
  const authenticationMiddleware = options.authenticationMiddleware || ((req, res, next) => {
    req.user = { id: userId };
    next();
  });
  const app = express();

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/', authenticationMiddleware, (req, res, next) => {
    if (!req.user?.id) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Autenticação necessária.' }
      });
    }
    next();
  }, createDocumentRoutes({
    service,
    uploadMiddleware: fileRepository.uploadSingle,
    maxUploadsPerMinute
  }));

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    const isMulterError = error instanceof multer.MulterError;
    const status = isMulterError
      ? error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
      : error.status || 500;
    const code = isMulterError
      ? error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD'
      : error.code || 'INTERNAL_SERVER_ERROR';
    const message = status < 500 ? error.message : 'Ocorreu um erro interno.';

    res.status(status).json({ error: { code, message } });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  const port = process.env.PORT || 3000;
  const host = '127.0.0.1';
  app.listen(port, host, () => {
    console.log(`DMS backend ouvindo em ${host}:${port}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;

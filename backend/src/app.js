const path = require('node:path');
const express = require('express');
const multer = require('multer');
const { createDocumentRepository }  = require('./repositories/documentRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentRoutes } = require('./routes/documentRoutes');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function createApp(options = {}) {
  const storageDir = path.resolve(
    options.storageDir || process.env.STORAGE_DIR || path.join(__dirname, '../storage')
  );
  const maxFileSizeBytes = Number(
    options.maxFileSizeBytes || process.env.MAX_FILE_SIZE_BYTES || DEFAULT_MAX_FILE_SIZE_BYTES
  );
  const userId = options.userId || process.env.DMS_USER_ID || 'local-user';

  if (!Number.isSafeInteger(maxFileSizeBytes) || maxFileSizeBytes <= 0) {
    throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
  }

  const repository = createDocumentRepository();
  const service = createDocumentService({ repository, storageDir });
  const app = express();

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use((req, res, next) => {
    req.user = { id: userId };
    next();
  });
  app.use('/', createDocumentRoutes({ service, storageDir, maxFileSizeBytes }));

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
  app.listen(port, () => {
    console.log(`DMS backend ouvindo na porta ${port}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;

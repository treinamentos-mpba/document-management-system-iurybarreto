const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const multer = require('multer');
const { createDocumentController } = require('../controllers/documentController');

function createDocumentRoutes({ service, storageDir, maxFileSizeBytes }) {
  const router = express.Router();
  const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, callback) {
        fs.mkdir(storageDir, { recursive: true }, (error) => callback(error, storageDir));
      },
      filename(req, file, callback) {
        callback(null, randomUUID());
      }
    }),
    limits: { fileSize: maxFileSizeBytes }
  });
  const controller = createDocumentController(service);

  router.post('/upload', upload.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = { createDocumentRoutes };
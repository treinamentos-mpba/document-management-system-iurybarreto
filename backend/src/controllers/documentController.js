const { toDocumentResponse } = require('./documentPresenter');

function createDocumentController(service) {
  return {
    async upload(req, res) {
      if (!req.file) {
        const error = new Error('Selecione um arquivo para enviar.');
        error.status = 400;
        error.code = 'FILE_REQUIRED';
        throw error;
      }

      const document = await service.createDocument({
        originalName: req.file.originalname,
        storageName: req.file.filename,
        size: req.file.size
      }, req.user.id);
      res.status(201).json(toDocumentResponse(document));
    },

    list(req, res) {
      const documents = service.listDocuments(req.user.id).map(toDocumentResponse);
      res.json({ documents });
    },

    async download(req, res) {
      const result = await service.getDocumentForDownload(req.params.id, req.user.id);
      if (!result) {
        const error = new Error('Documento não encontrado.');
        error.status = 404;
        error.code = 'DOCUMENT_NOT_FOUND';
        throw error;
      }

      res.download(result.filePath, result.document.originalName);
    }
  };
}

module.exports = { createDocumentController };
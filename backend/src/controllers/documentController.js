function createDocumentController(service) {
  return {
    upload(req, res) {
      if (!req.file) {
        const error = new Error('Selecione um arquivo para enviar.');
        error.status = 400;
        error.code = 'FILE_REQUIRED';
        throw error;
      }

      res.status(201).json(service.createDocument(req.file, req.user.id));
    },

    list(req, res) {
      res.json({ documents: service.listDocuments(req.user.id) });
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
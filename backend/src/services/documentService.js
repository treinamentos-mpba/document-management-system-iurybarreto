const { randomUUID } = require('node:crypto');

function createDocumentService({ repository, fileRepository }) {
  return {
    async createDocument(file, owner) {
      const document = {
        id: randomUUID(),
        originalName: file.originalName,
        storageName: file.storageName,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner
      };

      try {
        repository.save(document);
      } catch (error) {
        await fileRepository.remove(document.storageName).catch(() => {});
        throw error;
      }
      return document;
    },

    listDocuments(owner) {
      return repository.findByOwner(owner);
    },

    async getDocumentForDownload(id, owner) {
      const document = repository.findById(id);
      if (!document || document.owner !== owner) return null;

      const filePath = await fileRepository.getFilePath(document.storageName);
      if (!filePath) return null;

      return { document, filePath };
    }
  };
}

module.exports = { createDocumentService };
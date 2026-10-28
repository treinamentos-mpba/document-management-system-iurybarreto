const { randomUUID } = require('node:crypto');
const { access } = require('node:fs/promises');
const path = require('node:path');

function toPublicDocument(document) {
  const { storageName, ...publicDocument } = document;
  return publicDocument;
}

function createDocumentService({ repository, storageDir }) {
  return {
    createDocument(file, owner) {
      const document = {
        id: randomUUID(),
        originalName: file.originalname,
        storageName: file.filename,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner
      };

      repository.save(document);
      return toPublicDocument(document);
    },

    listDocuments(owner) {
      return repository.findByOwner(owner).map(toPublicDocument);
    },

    async getDocumentForDownload(id, owner) {
      const document = repository.findById(id);
      if (!document || document.owner !== owner) return null;

      const filePath = path.join(storageDir, document.storageName);
      try {
        await access(filePath);
      } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
      }

      return { document: toPublicDocument(document), filePath };
    }
  };
}

module.exports = { createDocumentService };
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const { access, unlink } = require('node:fs/promises');
const path = require('node:path');
const multer = require('multer');

function createLocalFileRepository({ storageDir, maxFileSizeBytes }) {
  const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, callback) {
        fs.mkdir(storageDir, { recursive: true }, (error) => callback(error, storageDir));
      },
      filename(req, file, callback) {
        callback(null, randomUUID());
      }
    }),
    limits: {
      fileSize: maxFileSizeBytes,
      files: 1,
      fields: 1,
      fieldSize: 256
    }
  });

  function resolvePath(storageName) {
    if (!storageName || path.basename(storageName) !== storageName) {
      throw new Error('Nome interno de arquivo inválido.');
    }
    return path.join(storageDir, storageName);
  }

  return {
    uploadSingle: upload.single('file'),

    async getFilePath(storageName) {
      const filePath = resolvePath(storageName);
      try {
        await access(filePath);
        return filePath;
      } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
      }
    },

    async remove(storageName) {
      try {
        await unlink(resolvePath(storageName));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  };
}

module.exports = { createLocalFileRepository };
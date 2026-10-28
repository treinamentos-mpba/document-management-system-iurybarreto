function toDocumentResponse(document) {
  const { storageName, ...publicDocument } = document;
  return publicDocument;
}

module.exports = { toDocumentResponse };
async function request(url, options) {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error?.message || 'Não foi possível concluir a solicitação.');
  }

  return result;
}

async function getErrorMessage(response) {
  const result = await response.json().catch(() => ({}));
  return result.error?.message || 'Não foi possível concluir a solicitação.';
}

export async function fetchDocuments() {
  const result = await request('/api/documents');
  return result.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request('/api/upload', { method: 'POST', body: formData });
}

export async function downloadDocument(documentId, fileName) {
  const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/download`);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const fileUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(fileUrl);
}
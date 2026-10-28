async function request(url, options) {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error?.message || 'Não foi possível concluir a solicitação.');
  }

  return result;
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
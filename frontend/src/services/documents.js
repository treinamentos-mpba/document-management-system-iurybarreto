async function assertSuccessfulResponse(response) {
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error?.message || 'Não foi possível concluir a solicitação.');
  }
}

async function request(url, options) {
  const response = await fetch(url, options);
  await assertSuccessfulResponse(response);
  return response.json();
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
  await assertSuccessfulResponse(response);

  const fileUrl = URL.createObjectURL(await response.blob());
  try {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
  } catch (error) {
    URL.revokeObjectURL(fileUrl);
    throw error;
  }
}
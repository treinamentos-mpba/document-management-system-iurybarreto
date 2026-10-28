function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function DocumentList({ documents, isLoading, error, onRetry }) {
  if (isLoading) {
    return <p className="list-message" role="status">Carregando documentos...</p>;
  }

  if (error) {
    return (
      <div className="list-message list-error" role="alert">
        <p>{error}</p>
        <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">0</span>
        <p>Nenhum documento enviado ainda.</p>
      </div>
    );
  }

  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li className="document-row" key={document.id}>
          <div className="document-detail">
            <span className="document-name">{document.originalName}</span>
            <span className="document-meta">
              {formatFileSize(document.size)} <span aria-hidden="true">·</span> {formatUploadDate(document.uploadedAt)}
            </span>
          </div>
          <a
            className="download-link"
            href={`/api/documents/${encodeURIComponent(document.id)}/download`}
            aria-label={`Baixar ${document.originalName}`}
          >
            Baixar <span aria-hidden="true">↓</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
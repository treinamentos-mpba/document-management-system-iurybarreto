import { useState } from 'react';
import { downloadDocument } from '../services/documents.js';

export function DownloadButton({ document }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setIsDownloading(true);
    setError('');
    try {
      await downloadDocument(document.id, document.originalName);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <span className="download-control">
      <button
        className="download-button"
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        aria-label={`Baixar ${document.originalName}`}
      >
        {isDownloading ? 'Baixando...' : <>Baixar <span aria-hidden="true">↓</span></>}
      </button>
      {error && <span className="download-error" role="alert">{error}</span>}
    </span>
  );
}
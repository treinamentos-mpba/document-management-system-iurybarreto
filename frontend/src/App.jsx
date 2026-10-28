import { useEffect, useState } from 'react';
import { DocumentList } from './components/DocumentList.jsx';
import { UploadForm } from './components/UploadForm.jsx';
import { fetchDocuments, uploadDocument } from './services/documents.js';
import './styles.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setLoadError('');
    fetchDocuments()
      .then((items) => {
        if (isCurrent) setDocuments(items);
      })
      .catch((error) => {
        if (isCurrent) setLoadError(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  async function handleUpload(file) {
    const document = await uploadDocument(file);
    setDocuments((currentDocuments) => [document, ...currentDocuments]);
    setLoadError('');
  }

  return (
    <main className="workspace">
      <header className="masthead">
        <a className="wordmark" href="/" aria-label="Documentos, página inicial">
          <span className="wordmark-mark" aria-hidden="true">D</span>
          <span>Documentos</span>
        </a>
        <span className="masthead-caption">ARQUIVO PESSOAL</span>
      </header>

      <section className="page-heading" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">SEU ESPAÇO DE TRABALHO</p>
          <h1 id="page-title">Seus documentos,<br />em um só lugar.</h1>
        </div>
        <p className="heading-note">
          Arquivos guardados com simplicidade, prontos para consultar quando precisar.
        </p>
      </section>

      <UploadForm onUpload={handleUpload} />

      <section className="documents-section" aria-labelledby="documents-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BIBLIOTECA</p>
            <h2 id="documents-title">Arquivos enviados</h2>
          </div>
          {!isLoading && <span className="document-count">{documents.length}</span>}
        </div>
        <DocumentList
          documents={documents}
          isLoading={isLoading}
          error={loadError}
          onRetry={() => setRefreshKey((key) => key + 1)}
        />
      </section>
      <footer className="page-footer">Armazenamento local · documentos privados</footer>
    </main>
  );
}

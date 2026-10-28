import { useRef, useState } from 'react';

export function UploadComponent({ onUpload }) {
  const inputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError('Selecione um arquivo antes de enviar.');
      return;
    }

    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      await onUpload(file);
      setSuccess(`${file.name} foi enviado.`);
      inputRef.current.value = '';
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <div className="upload-copy">
        <p className="eyebrow">NOVO DOCUMENTO</p>
        <h2 id="upload-title">Adicione um arquivo</h2>
        <p>Selecione um documento para guardar na sua biblioteca.</p>
      </div>
      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="file-input-label" htmlFor="document-file">Arquivo</label>
        <input
          ref={inputRef}
          id="document-file"
          name="file"
          type="file"
          required
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar arquivo'}
        </button>
      </form>
      <p className="form-feedback" aria-live="polite" role={error ? 'alert' : undefined}>
        {error || success}
      </p>
    </section>
  );
}
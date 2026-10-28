import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  downloadDocument,
  fetchDocuments,
  uploadDocument
} from '../src/services/documents.js';

test('lista documentos pelo prefixo /api', async (context) => {
  const documents = [{ id: 'doc-1', originalName: 'nota.txt' }];
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({ documents })
  }));

  assert.deepEqual(await fetchDocuments(), documents);
  assert.equal(fetchMock.mock.calls[0].arguments[0], '/api/documents');
});

test('envia arquivo multipart pelo prefixo /api', async (context) => {
  const file = new File(['conteúdo'], 'nota.txt', { type: 'text/plain' });
  const document = { id: 'doc-1', originalName: file.name };
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => document
  }));

  assert.deepEqual(await uploadDocument(file), document);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, '/api/upload');
  assert.equal(options.method, 'POST');
  assert.equal(options.body.get('file').name, file.name);
});

test('baixa um blob e só revoga a URL após agendar a limpeza', async (context) => {
  const originalDocument = globalThis.document;
  context.after(() => {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  });

  const link = { click() {}, remove() {} };
  let appendedLink;
  globalThis.document = {
    createElement: (tagName) => {
      assert.equal(tagName, 'a');
      return link;
    },
    body: {
      append: (element) => { appendedLink = element; }
    }
  };

  let cleanup;
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    blob: async () => new Blob(['conteúdo'])
  }));
  context.mock.method(URL, 'createObjectURL', () => 'blob:dms-document');
  const revokeMock = context.mock.method(URL, 'revokeObjectURL', () => {});
  context.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    assert.equal(delay, 1000);
    cleanup = callback;
    return 1;
  });

  await downloadDocument('doc/1', 'nota.txt');

  assert.equal(fetchMock.mock.calls[0].arguments[0], '/api/documents/doc%2F1/download');
  assert.equal(appendedLink, link);
  assert.equal(link.download, 'nota.txt');
  assert.equal(revokeMock.mock.callCount(), 0);
  cleanup();
  assert.equal(revokeMock.mock.callCount(), 1);
});

test('propaga a mensagem de erro da API', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => ({
    ok: false,
    json: async () => ({ error: { message: 'Arquivo não encontrado.' } })
  }));

  await assert.rejects(fetchDocuments(), { message: 'Arquivo não encontrado.' });
});
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/app');

async function withServer(options, run) {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const app = createApp({ storageDir, userId: 'test-user', ...options });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const address = server.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await fs.rm(storageDir, { recursive: true, force: true });
  }
}

test('o app backend é exportado e mantém o health check', async () => {
  const app = require('../src/app');
  assert.equal(typeof app, 'function');

  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });
});

test('envia, lista e baixa um documento sem expor o nome interno', async () => {
  await withServer({}, async (baseUrl) => {
    const formData = new FormData();
    formData.append('file', new Blob(['conteudo local'], { type: 'text/plain' }), 'nota.txt');
    formData.append('owner', 'usuario-forjado');

    const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: formData });
    assert.equal(uploadResponse.status, 201);
    const uploaded = await uploadResponse.json();
    assert.equal(uploaded.originalName, 'nota.txt');
    assert.equal(uploaded.owner, 'test-user');
    assert.equal(uploaded.size, 14);
    assert.equal('storageName' in uploaded, false);

    const listResponse = await fetch(`${baseUrl}/documents`);
    assert.deepEqual(await listResponse.json(), { documents: [uploaded] });

    const downloadResponse = await fetch(`${baseUrl}/documents/${uploaded.id}/download`);
    assert.equal(downloadResponse.status, 200);
    assert.equal(await downloadResponse.text(), 'conteudo local');
    assert.match(downloadResponse.headers.get('content-disposition'), /filename="nota\.txt"/);
  });
});

test('retorna erro claro quando nenhum arquivo é enviado', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: new FormData()
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'FILE_REQUIRED');
  });
});

test('rejeita arquivos maiores que o limite configurado', async () => {
  await withServer({ maxFileSizeBytes: 4 }, async (baseUrl) => {
    const formData = new FormData();
    formData.append('file', new Blob(['grande demais']), 'arquivo.txt');

    const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: formData });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).error.code, 'FILE_TOO_LARGE');
  });
});

test('retorna 404 para documento inexistente', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/documents/nao-existe/download`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
  });
});

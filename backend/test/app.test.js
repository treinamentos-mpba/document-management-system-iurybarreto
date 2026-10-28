const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/app');
const { createLocalFileRepository } = require('../src/repositories/localFileRepository');

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

test('exige uma identidade fornecida pelo middleware de autenticação', async () => {
  await withServer({ authenticationMiddleware: (req, res, next) => next() }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/documents`);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, 'UNAUTHENTICATED');
  });
});

test('limita uploads por cliente dentro da janela configurada', async () => {
  await withServer({ maxUploadsPerMinute: 1 }, async (baseUrl) => {
    const firstForm = new FormData();
    firstForm.append('file', new Blob(['primeiro']), 'primeiro.txt');
    const firstResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: firstForm });
    assert.equal(firstResponse.status, 201);

    const secondForm = new FormData();
    secondForm.append('file', new Blob(['segundo']), 'segundo.txt');
    const secondResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: secondForm });
    assert.equal(secondResponse.status, 429);
    assert.equal((await secondResponse.json()).error.code, 'UPLOAD_RATE_LIMITED');
  });
});

test('rejeita nomes internos que tentem escapar do diretório de armazenamento', async () => {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-path-test-'));
  const fileRepository = createLocalFileRepository({
    storageDir,
    maxFileSizeBytes: 1024
  });

  try {
    await assert.rejects(fileRepository.getFilePath('../outside.txt'), /Nome interno de arquivo inválido/);
  } finally {
    await fs.rm(storageDir, { recursive: true, force: true });
  }
});

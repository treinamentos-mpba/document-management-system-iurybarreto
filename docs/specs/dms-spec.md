# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem documentos, armazenando os arquivos no filesystem local e mantendo os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos associados ao usuário configurado no servidor.
- Download de um documento pelo identificador.
- Interface React para upload, listagem e download.
- Armazenamento local com `multer` e `diskStorage`.

### Fora do escopo

- Armazenamento em nuvem ou em serviços externos.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Persistência durável dos metadados.
- Cadastro de usuários, login e gestão de credenciais.
- Busca, filtros avançados e paginação.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo usando o formulário ou a API. |
| RF-02 | O upload recebe um único arquivo no campo multipart `file`. |
| RF-03 | O sistema rejeita requisições sem arquivo ou acima do limite configurado. |
| RF-04 | O servidor gera identificador e nome físico interno únicos; o nome original não é usado como caminho no filesystem. |
| RF-05 | O sistema registra os metadados em memória e os retorna após um upload bem-sucedido. |
| RF-06 | O usuário pode listar os documentos associados à identidade resolvida pelo servidor. |
| RF-07 | O usuário pode baixar um documento próprio pelo identificador. |
| RF-08 | Documento inexistente ou cujo arquivo não está disponível retorna `404`. |
| RF-09 | A interface apresenta estados de carregamento, vazio, sucesso e erro. |
| RF-10 | O usuário pode iniciar o download de cada documento listado. |
| RF-11 | O proprietário não pode ser definido pelo campo `owner` enviado pelo cliente. |
| RF-12 | O endpoint `GET /health` permanece disponível. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Arquivos são gravados somente no filesystem local usando `multer` com `diskStorage`, em `backend/storage` por padrão. |
| RNF-02 | Metadados ficam em memória e podem ser perdidos ao reiniciar o backend. |
| RNF-03 | Porta, diretório de armazenamento, limites de arquivo e frequência de upload, e identidade local são configuráveis por variáveis de ambiente. |
| RNF-04 | Respostas não expõem caminhos físicos ou nomes internos de armazenamento. |
| RNF-05 | Valores fornecidos pelo cliente não são concatenados a caminhos de arquivo. |
| RNF-06 | Erros de entrada, upload e leitura são tratados nas fronteiras HTTP. |
| RNF-07 | O frontend acessa a API pelo prefixo `/api`; o proxy Vite remove esse prefixo em desenvolvimento. |

### Configuração

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local dos arquivos enviados. |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Limite de upload de 10 MiB. |
| `MAX_UPLOADS_PER_MINUTE` | `30` | Máximo de uploads por minuto por endereço IP. |
| `DMS_USER_ID` | `local-user` | Identidade fixa atribuída pelo servidor nesta versão. |

O executável escuta em `127.0.0.1` por padrão. `DMS_USER_ID` não implementa autenticação. Todos os clientes locais de uma mesma instância compartilham essa identidade; isolamento multiusuário real depende de integração futura com middleware de autenticação confiável antes de expor a API à rede.

## 5. Modelo de dados

### Documento

| Campo | Tipo | Visibilidade | Descrição |
| --- | --- | --- | --- |
| `id` | string | Público | Identificador único, UUID gerado pelo servidor. |
| `originalName` | string | Público | Nome original para exibição e nome do download. |
| `size` | number | Público | Tamanho em bytes. |
| `uploadedAt` | string | Público | Data e hora do upload em ISO 8601. |
| `owner` | string | Público | Identidade definida pela configuração do servidor. |
| `storageName` | string | Interno | Nome gerado para o arquivo no disco; nunca retornado pela API. |

O caminho é derivado no backend a partir do diretório configurado e de `storageName`. O repositório mantém metadados em memória indexados por `id`.

## 6. Contratos de API

### Formato de erro

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

### `POST /upload`

- Entrada: `multipart/form-data`, arquivo no campo `file`.
- Sucesso: `201 Created` com metadados públicos do documento.
- Erros: `400` para arquivo ausente ou entrada inválida; `413` para arquivo acima do limite; `500` para falha inesperada.

```json
{
  "id": "uuid",
  "originalName": "relatorio.pdf",
  "size": 153600,
  "uploadedAt": "2026-10-28T12:00:00.000Z",
  "owner": "local-user"
}
```

### `GET /documents`

- Sucesso: `200 OK`, lista de documentos do usuário configurado, ordenada por data decrescente.

```json
{
  "documents": [
    {
      "id": "uuid",
      "originalName": "relatorio.pdf",
      "size": 153600,
      "uploadedAt": "2026-10-28T12:00:00.000Z",
      "owner": "local-user"
    }
  ]
}
```

### `GET /documents/:id/download`

- Sucesso: `200 OK` com conteúdo binário e `Content-Disposition: attachment`, usando o nome original.
- Erros: `404` para documento ou arquivo inexistente; `500` para falha inesperada de leitura.

### `GET /health`

- Sucesso: `200 OK`.

```json
{
  "status": "ok"
}
```

No frontend, os caminhos são chamados sob `/api`; por exemplo, `GET /api/documents` é encaminhado pelo Vite para `GET /documents` no backend.

## 7. Decisões arquiteturais

- Backend em Node.js, Express e CommonJS.
- Fluxo de dependência: `routes -> controllers -> services -> repositories`.
- Rotas registram endpoints e middleware Multer para gravação local com `diskStorage`.
- Controllers fazem a tradução entre HTTP e serviços, validando a presença do arquivo.
- Services aplicam regras de criação, listagem e acesso ao download.
- Repositories mantêm metadados em memória.
- Frontend em React com componentes funcionais, Hooks e `fetch`.
- O frontend usa o proxy Vite com prefixo `/api`.
- Os nomes de arquivo físicos são gerados no servidor; o nome original é somente metadado.
- Metadados voláteis não permitem reconstruir a listagem após reiniciar o processo.

## 8. Plano de execução

1. **Definir identidade e configuração**: confirmar integração futura de autenticação, limite de upload e diretório local. Aceite: variáveis documentadas e identidade nunca escolhida pelo cliente.
2. **Implementar backend**: criar rotas, controllers, services e repositories para upload, listagem e download. Aceite: contratos atendidos, arquivo local e metadados em memória.
3. **Implementar frontend**: criar serviço de API e interface de upload, listagem e download. Aceite: fluxo funciona pelo proxy `/api`, com estados de carregamento, vazio e erro.
4. **Validar integração e testes**: cobrir upload, listagem, download, arquivo ausente, limite e isolamento conforme identidade disponível. Aceite: testes e build passam e o proxy alcança a API.

As etapas 2 e 3 descrevem trabalho de implementação; este documento, por si só, não executa nem altera arquivos de backend ou frontend.
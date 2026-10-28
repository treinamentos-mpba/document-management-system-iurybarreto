---
description: Valida uma funcionalidade implementada contra a especificação e os testes do projeto.
name: validar-feature
argument-hint: funcionalidade ou caminho da especificação
agent: agent
---

# Validar funcionalidade

Valide a funcionalidade `${input:escopo:funcionalidade ou caminho da especificação}` antes do commit.

- Leia a especificação relevante e inspecione as alterações atuais do worktree.
- Compare os requisitos com o comportamento implementado e a cobertura de testes.
- Execute os testes e builds pertinentes ao escopo.
- Corrija apenas problemas diretamente ligados à funcionalidade.
- Preserve alterações existentes e não faça commit ou push.
- Ao final, resuma os arquivos alterados, verificações executadas e lacunas restantes.

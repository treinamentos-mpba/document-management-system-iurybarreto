---
description: Audita uma funcionalidade contra sua especificação, identifica regressões com evidências e executa verificações focadas.
name: validar-feature
argument-hint: funcionalidade ou caminho da especificação
agent: agent
---

# Validar funcionalidade

Valide a funcionalidade `${input:escopo:funcionalidade ou caminho da especificação}` antes do commit. Use a especificação como contrato e o código como evidência.

## Processo

1. Leia a especificação indicada, as instruções do projeto e o diff atual. Identifique os requisitos e arquivos diretamente relacionados.
2. Revise o comportamento implementado procurando bugs, falhas de tratamento de erro, regressões e riscos de segurança relevantes ao escopo. Leia os corpos das funções envolvidas, não apenas assinaturas ou nomes.
3. Verifique cada requisito da especificação individualmente e compare-o com o comportamento observado e os testes existentes.
4. Execute os testes e builds pertinentes ao escopo. Se encontrar e corrigir um problema confirmado, repita a verificação que o detectou.

## Guardrails

- Antes de afirmar que algo está ausente, pesquise no repositório pelos nomes, rotas ou comportamentos relacionados.
- Toda falha reportada deve incluir referência `arquivo:linha` e descrever comportamento esperado versus observado. Se não houver evidência suficiente, registre como dúvida ou lacuna, não como bug confirmado.
- Priorize defeitos, risco de segurança, regressões e requisitos não atendidos. Não reporte preferências de estilo ou refatorações sem impacto funcional.
- Corrija somente problemas confirmados e diretamente ligados à funcionalidade indicada.
- Preserve alterações preexistentes e não faça commit ou push.

## Resultado

Apresente:

1. Achados confirmados, ordenados por severidade, com `arquivo:linha`, consequência e correção aplicada ou recomendada.
2. Uma matriz curta de requisitos com status `ATENDE`, `FALHA` ou `NÃO VERIFICADO` e evidência.
3. Testes e builds executados, resultado e lacunas restantes.

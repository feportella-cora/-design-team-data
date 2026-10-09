# Design Team Data

Dados versionados para consulta do portal do time de Design.

## Fontes

- [ORG DESIGN](https://docs.google.com/spreadsheets/d/1AiFPYBQ3jF2viccTqb4gEgNUxO1p6UjS1cfjcTW9ZZU/edit) — permissões e controle de acessos.
- [Design - Férias & Licença remunerada & Day off](https://docs.google.com/spreadsheets/d/1Xr-RXWlKVad0drRPkxlBZkT1MmMEbBFT3qlxnIoV0_k/edit) — planejamento de 2026.
- [Matriz de Proficiência em IA — respostas](https://docs.google.com/spreadsheets/d/1F7qIcvfl18mVszK_kSuiyFxF-DG-DzgT4_3h5K8kx-k/edit) — perguntas e respostas do self assessment.

## Estrutura

- `data/access-control.json`: pessoas, posição e escopo de acesso.
- `data/time-off-2026.json`: férias, licença remunerada e day off de 2026.
- `data/ai-assessment-questions.json`: perguntas da avaliação, em ordem, com a origem da nota.
- `data/ai-assessment-submissions.json`: respostas/notas recebidas pelo portal. Começa vazio porque a planilha de respostas não tinha registros no snapshot de 2026-10-09.
- `schemas/ai-assessment-submission.schema.json`: contrato de uma submissão.
- `scripts/validate-data.mjs`: valida os JSONs e aponta datas de origem inválidas sem alterá-las.

## Fonte oficial do assessment DesignIA

- `sources/designia/designia.corable.json`: export original enviado pelo time, preservado para rastreabilidade.
- `sources/designia/implementation-reference.ts`: conteúdo e regras originais de `data.ts`, `calc.ts` e `hierarchy.ts` do export.

O portal deve reproduzir literalmente os textos das perguntas e das opções presentes no export DesignIA. Não deve resumir, reescrever ou inventar alternativas. A configuração estruturada consumida pela interface deve ser derivada desses arquivos e validada contra eles.

O export é referência de conteúdo e comportamento; ele não deve ser executado diretamente no frontend do Hub. A autenticação, as permissões e a persistência devem seguir a arquitetura do Hub.

## Recebimento de notas pelo portal

O portal deve enviar uma submissão no formato definido em `schemas/ai-assessment-submission.schema.json` para um backend/edge function. Esse backend deve validar o payload e criar um commit no branch `main` atualizando `data/ai-assessment-submissions.json`.

Não coloque um token de GitHub no frontend. Use uma GitHub App ou token de curta duração em uma função server-side, com permissão mínima de `Contents: Read and write` apenas neste repositório.

## Privacidade

Os dados contêm e-mails corporativos e informações de ausência. Antes de tornar este repositório público, confirme a política de acesso do time e, se necessário, torne o repositório privado ou remova os identificadores pessoais.

## Validação local

```bash
node scripts/validate-data.mjs
```

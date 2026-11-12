# Laboratório de Eletrônica

Trilha interativa de Engenharia Eletrônica e Microeletrônica para estudar no navegador.

Site: https://l7-collab.github.io/laboratorio-eletronica-site/

## Estrutura

- `catalogo.js`: 14 módulos de nivelamento, projetos e 60 disciplinas em 10 semestres.
- `trilha-dados.js` e `trilha.js`: 24 etapas guiadas (14 módulos e 10 desafios), quizzes, metas e revisões. A ordem já existente foi preservada.
- `anotacoes.js`: caderno por categoria.
- `recursos.js`: apostilas e videoaulas verificadas. `modules.M00` a `modules.M13` são separados de `subjects`, reservado aos IDs `01` a `60` da grade.
- `materiais/`: 14 PDFs de seis páginas, com fundamentos, exemplos, aplicações, exercícios, soluções, figuras e bibliografia.
- `calculadora-core.js`: parser recursivo com lista fechada de operadores e funções. Não usa eval ou Function.
- `calculadora.js`: teclado touch/físico, DEG/RAD, histórico e reutilização. `%` divide por 100; `^` é potência; `27^(1/3)` é raiz cúbica positiva.
- `historico-core.js`: normalização e união determinística do histórico por UUID.
- `nuvem.js`: fila local e sincronização autenticada com comparação de revisão.
- `nuvem-worker.mjs`: Worker existente, com o mesmo D1 e autenticação de proprietário único. Depende do módulo `historico-core.js` no upload.

## Dados e limites

As chaves antigas de progresso, quizzes, revisões e anotações permanecem iguais. A calculadora usa exclusivamente `laboratorio-eletronica:calculadora:v1`, separada da trilha. O navegador conserva os dados depois de fechar a aba; limpar os dados do site ou usar navegação privada elimina a cópia local. A nuvem depende de uma sessão válida.

São mantidos os últimos 80 cálculos, com expressão expandida quando usa Ans, resultado numérico, data ISO e modo angular. Expressões têm até 180 caracteres, resultado aproximado IEEE-754 e apresentação com 12 algarismos significativos. Não há álgebra simbólica nem números complexos. Resultados e entradas não finitos são rejeitados.

O Worker aceita registros de até 60.000 caracteres e requisições de até 300.000 caracteres; anotações continuam limitadas a 20.000 por categoria. A retenção máxima da calculadora é 80, combinada com a retenção preexistente de até 20 versões no D1. Não houve migração ou exclusão de tabelas.

Contas criadas simultaneamente são unidas por UUID, em ordem de data e ID. Respostas 409 provocam união e nova tentativa com a revisão corrente. A exclusão pede confirmação e grava um marco temporal: contas com data anterior ou igual ao marco não reaparecem quando um aparelho offline sincroniza. Os aparelhos precisam estar com relógio correto. Erros de rede preservam a fila local para reenvio. Conflitos de notas e progresso continuam exigindo escolha explícita na seção Nuvem.

## Adicionar materiais futuramente

Em `recursos.js`, cadastre `{pdf, videos:[{title, channel, subject, url, verified}]}` em `studyResources.subjects['01']`, por exemplo. A grade já renderiza esses recursos quando presentes. Não reutilize IDs M00-M13 para disciplinas.

## Verificação

Requer Node.js com `node:sqlite` (Node 22 ou superior):

```sh
node --test test-calculadora.cjs test-sync.cjs test-worker.mjs
```

A suíte cobre matemática, rejeição de código, domínios inválidos, união, exclusão, limite de retenção, concorrência e recuperação em dois armazenamentos isolados usando o código real de sincronização. O Worker é exercitado com SQLite temporário em memória, incluindo login, sessões, validação, revisões e preservação das chaves antigas. Não usa credenciais nem modifica dados reais.

## Hospedagem

Frontend servido pelo GitHub Pages a partir de `main`, na estrutura existente. O backend permanece em https://laboratorio-eletronica-sync.l7526080.workers.dev. Ao atualizar o Worker, preserve a ligação D1 `DB`, todos os secrets e a data de compatibilidade; envie também `historico-core.js`. Nunca publique credenciais no repositório.

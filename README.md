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


## Teclado matemático nos exercícios

- Os exercícios de conteúdo matemático possuem um botão "Abrir teclado matemático", que carrega MathLive 0.111.4 sob demanda.
- O teclado permite frações, frações aninhadas, potências, expoentes fracionários, raízes, operações, parênteses e símbolos de eletrônica. O teclado físico também funciona.
- A resposta discursiva pode incluir texto e uma expressão em LaTeX. Os rascunhos ficam em \`laboratorio-eletronica:trilha:v1\`, no campo opcional \`drafts\`, preservando \`passed\`, \`attempts\`, \`reviews\` e todos os dados anteriores.
- As perguntas de múltipla escolha, correção e desbloqueio permanecem inalterados. Não é realizada correção algébrica automática de respostas discursivas.
- Se a biblioteca externa não carregar, o campo convencional de texto permanece disponível.
- Para testar: \`node --test test-calculadora.cjs test-sync.cjs test-worker.mjs test-teclado-matematico.cjs\`.
- Depois da publicação, confirmar as interações no Safari do iPhone 11 (retrato e paisagem) e validar a sincronização com uma conta de teste antes de utilizar com dados reais.

## Sequência e desbloqueio dos módulos (correção 2026-11-15)

- Ordem curricular obrigatória: M00 a M13, seguida de S01 a S10.
- A versão anterior inseria M03 e M06 antes de M00. A correção ordena os módulos sem apagar as conclusões já salvas.
- Para estudantes com progresso na ordem antiga, o próximo módulo após M03 é M04; módulos previamente concluídos continuam acessíveis.
- O progresso é identificado por ID de módulo, não pela posição na lista, e o contador mostra quantos IDs válidos foram concluídos.
- Se o registro da última tentativa mostrar 3/3 e a marcação de conclusão tiver sido perdida, a conclusão é reconstruída a partir das respostas salvas.
- Marcar um módulo como “revisado” no índice não equivale a passar no quiz (que exige três acertos).
- Executar `node --test test-trilha-progress.cjs` junto com a suíte de regressão da calculadora, sincronização e Worker.

## Teclado matemático no iPhone (15/11/2026)

O teclado da resposta matemática é um painel virtual do MathLive exibido pelo navegador, semelhante à experiência de exercícios da Khan Academy: sites não conseguem modificar o teclado nativo do iOS. A partir desta atualização, nos módulos com cálculo, o **campo matemático é a resposta principal** e aparece antes da explicação textual (opcional). Toque no campo para abrir automaticamente o teclado matemático na parte inferior da tela; ele usa layouts numérico, símbolos e letras. O botão **Concluir expressão** fecha o teclado sem apagar a resposta, e um novo toque reabre a edição.

Os atalhos abaixo do campo permitem fração, potência, expoente fracionário, raiz quadrada, raiz com índice e π, inclusive no celular. No computador continua disponível o teclado físico. Não há alteração do endpoint, das chaves de sincronização, de autenticação ou do histórico da calculadora; a expressão continua salva no rascunho do exercício.

Se a biblioteca MathLive não puder ser carregada, a resposta por texto permanece utilizável. Os testes de automação conferem os eventos de foco, exibição e fechamento do teclado em simulação; o comportamento no Safari físico do iPhone 11 exige homologação no dispositivo.


## Login recorrente e salvamento de progresso na nuvem (15/11/2026)

- O Laboratório é de uso individual: **a conta já cadastrada permanece a mesma**. Não é preciso repetir o primeiro acesso. A criação de conta só é oferecida quando há um convite inicial válido e o usuário escolhe explicitamente essa opção.
- Depois de sair, expirar a sessão ou abrir o site como aplicativo na tela inicial do iPhone, toque em **Nuvem → Entrar na minha conta** e use o usuário e senha existentes. As sessões ativas no mesmo navegador são mantidas enquanto válidas.
- O progresso é salvo primeiro em \`localStorage\` e, com uma sessão autenticada, a fila do \`nuvem.js\` envia as alterações ao Worker Cloudflare e ao D1 existente. A mensagem “Tudo sincronizado com a nuvem” só aparece após uma sincronização com resposta de sucesso.
- O recurso \`progresso-sync-core.js\` concilia módulos concluídos, quizzes e respostas de módulos distintos de Safari e do app da tela inicial. Em caso de duas respostas livres incompatíveis na mesma atividade, exige decisão explícita em vez de descartar uma delas.
- O servidor atual usa **uma conta pessoal**, não um sistema multiusuário. A atualização não altera credenciais, tokens, D1, tabelas, endpoints ou sessões anteriores. O acesso por nome de usuário e senha recupera os mesmos registros.
- Para conferir: conectar o iPhone na tela Nuvem, esperar a confirmação, fechar e reabrir, verificar os módulos concluídos; se instalado na tela inicial, fazer login nessa instalação separadamente uma vez.
- Segurança: não limpar os dados locais antes de confirmar sincronização, nem compartilhar a senha. Em caso de conflito, ler ambas as versões antes de escolher.
- Testes automatizados: \`node --test test-progresso-sync.cjs test-login-retorno.cjs test-sync.cjs test-worker.mjs\`.

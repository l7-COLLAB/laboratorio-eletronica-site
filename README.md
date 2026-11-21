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


## Ferramentas de resposta estruturada (15/11/2026)

A auditoria das 24 práticas identificou uma única solicitação explícita de desenho livre (M06), já equipada com o triângulo 5–12–13 e seleção de lados, ângulo e seno/cosseno. O M06 agora marca o ângulo na posição escolhida e permite comparar a resolução depois de completar a tentativa, mesmo que a escolha esteja incorreta.

Os demais enunciados que pedem uma representação visual ou várias escolhas passaram a ter instrumentos específicos: M05 (tabela da função), M09 (esquema em série), M10 (NAND), M11 (tabela de testes), M12 (roteiro de experimento), S01 (pares I-V e gráfico), S02 (esquema do nó), S04 (comparação de amostragem), S06 (tabela de estados CMOS), S07 (seleção por restrições), S08 (DRC/LVS/STA), S09 (planejamento de carga) e S10 (resultado e limitações). Os campos de resposta de múltipla escolha possuem valores e critérios objetivos com botão **Corrigir atividade**. As propostas e justificativas são registradas e comparadas com o exemplo resolvido, **sem avaliação semântica automática**. O aluno ainda precisa obter 3/3 no quiz para concluir o módulo.

Os widgets novos usam `drafts[id].diagram` e a sanitização já existente; não alteram login, D1, Worker, endpoint, conta nem campos de progresso. Respostas numéricas anteriores permanecem guardadas; o editor de M05/M09 preenche valores compatíveis a partir dos dados legados quando não há rascunho novo. O layout é responsivo, sem arraste obrigatória para funcionar no iPhone, e o service worker versiona os novos recursos. Executar `node --test test-pratica-estruturada.cjs` junto à suíte geral. Testes reais no iPhone 11 ainda são necessários para confirmar ergonomia, gráficos e sincronização.

## Teclado matemático nos exercícios

- Os exercícios de conteúdo matemático possuem um botão "Abrir teclado matemático", que carrega MathLive 0.111.4 sob demanda.
- O teclado permite frações, frações aninhadas, potências, expoentes fracionários, raízes, operações, parênteses e símbolos de eletrônica. O teclado físico também funciona.
- A resposta discursiva pode incluir texto e uma expressão em LaTeX. Os rascunhos ficam em \`laboratorio-eletronica:trilha:v1\`, no campo opcional \`drafts\`, preservando \`passed\`, \`attempts\`, \`reviews\` e todos os dados anteriores.
- As respostas discursivas são avaliadas por comparação com a resolução. Não é realizada correção algébrica automática de respostas discursivas.
- Se a biblioteca externa não carregar, o campo convencional de texto permanece disponível.
- Para testar: \`node --test test-calculadora.cjs test-sync.cjs test-worker.mjs test-teclado-matematico.cjs\`.
- Depois da publicação, confirmar as interações no Safari do iPhone 11 (retrato e paisagem) e validar a sincronização com uma conta de teste antes de utilizar com dados reais.

## Acesso aos módulos e registro de conclusão

- Todos os módulos M00 a M13 e desafios S01 a S10 podem ser abertos pelo menu Meu curso, mesmo sem progresso salvo. A lista segue a ordem curricular.
- A versão anterior inseria M03 e M06 antes de M00. A correção ordena os módulos sem apagar as conclusões já salvas.
- Para estudantes com progresso na ordem antiga, o próximo módulo após M03 é M04; módulos previamente concluídos continuam acessíveis.
- O progresso é identificado por ID de módulo, não pela posição na lista, e o contador mostra quantos IDs válidos foram concluídos.
- Se o registro da última tentativa mostrar 3/3 e a marcação de conclusão tiver sido perdida, a conclusão é reconstruída a partir das respostas salvas.
- Marcar um módulo como “revisado” no índice não equivale a passar no quiz (que exige três acertos).
- Executar `node --test test-trilha-progress.cjs` junto com a suíte de regressão da calculadora, sincronização e Worker.

## Visor da calculadora sem campos editáveis no iPhone (15/11/2026)

A solução anterior com `inputmode=none` e `readonly` ainda deixava o navegador incorporado do iPhone abrir o teclado, pois a detecção de dispositivos touch falhava nesse ambiente. Esta revisão troca o `<input>` por um visor `<div role="textbox" aria-readonly="true">` **não editável em nenhum dispositivo**, evitando a criação de qualquer teclado nativo para a expressão. Os botões da calculadora inserem, apagam, editam por cursor esquerda/direita e reutilizam histórico com um modelo de expressão em JavaScript, limitado a 180 caracteres. Em computadores, um listener de teclado físico executa os mesmos comandos quando a tela da calculadora está visível, sem capturar teclas de outros campos de texto. Progresso, login, Worker, D1, chaves de histórico e sincronização não são alterados. A versão do cache de arquivos do PWA e os parâmetros dos recursos foram atualizados. Testes de regressão garantem que o HTML não tenha campo editável e que os botões funcionem mesmo que o iPhone não seja identificado como touch.

## Calculadora científica sem teclado nativo no iPhone (15/11/2026)

A calculadora em `#calculadora` é diferente do teclado matemático das práticas. No iPhone, o campo `calc-expressao` passa a ser `readonly` com `inputmode=none`; os botões da calculadora inserem, apagam e reutilizam expressões diretamente sem forçar foco e sem abrir o teclado do iOS. O campo continua selecionável para posicionar o cursor. Em computadores sem toque, a inicialização remove `readonly` e mantém digitação física, Enter e Esc. O rascunho da expressão não passa a ser sincronizado; o histórico continua com a mesma chave e regras de armazenamento já existentes. Testes `test-calculadora-mobile.cjs` cobrem ambas as modalidades, inclusão/remoção e a ausência de foco programático no celular. Confirmar visualmente no iPhone físico após publicar e reabrir o PWA.

## Teclado matemático no iPhone (15/11/2026)

O teclado da resposta matemática é um painel virtual do MathLive exibido pelo navegador, semelhante à experiência de exercícios da Khan Academy: sites não conseguem modificar o teclado nativo do iOS. A partir desta atualização, nos módulos com cálculo, o **campo matemático é a resposta principal** e aparece antes da explicação textual (opcional). Toque no campo para abrir automaticamente o teclado matemático na parte inferior da tela; ele usa layouts numérico, símbolos e letras. O botão **Concluir expressão** fecha o teclado sem apagar a resposta, e um novo toque reabre a edição.

Os atalhos abaixo do campo permitem fração, potência, expoente fracionário, raiz quadrada, raiz com índice e π, inclusive no celular. No computador continua disponível o teclado físico. Não há alteração do endpoint, das chaves de sincronização, de autenticação ou do histórico da calculadora; a expressão continua salva no rascunho do exercício.

Se a biblioteca MathLive não puder ser carregada, a resposta por texto permanece utilizável. Os testes de automação conferem os eventos de foco, exibição e fechamento do teclado em simulação; o comportamento no Safari físico do iPhone 11 exige homologação no dispositivo.


### Correção de foco no teclado do iPhone (15/11/2026)

O controle do teclado matemático usa política manual nos dispositivos touch, evitando a dupla abertura automática + programática. A lista de layouts é configurada apenas uma vez por editor, para não reconstruir o painel quando o foco retorna ao campo depois de selecionar as letras. O campo deixa de criar uma região própria de rolagem horizontal, reduzindo o salto de posição no Safari. Há teste de regressão para a seleção alfabética. Os rascunhos e dados da nuvem não são alterados.

A correção depende de confirmação no iPhone 11 real, especialmente alternar para Letras, inserir uma variável, voltar a Números, abrir e fechar o teclado e verificar a rolagem da página.

## Login recorrente e salvamento de progresso na nuvem (15/11/2026)

- O Laboratório é de uso individual: **a conta já cadastrada permanece a mesma**. Não é preciso repetir o primeiro acesso. A criação de conta só é oferecida quando há um convite inicial válido e o usuário escolhe explicitamente essa opção.
- Depois de sair, expirar a sessão ou abrir o site como aplicativo na tela inicial do iPhone, toque em **Nuvem → Entrar na minha conta** e use o usuário e senha existentes. As sessões ativas no mesmo navegador são mantidas enquanto válidas.
- O progresso é salvo primeiro em \`localStorage\` e, com uma sessão autenticada, a fila do \`nuvem.js\` envia as alterações ao Worker Cloudflare e ao D1 existente. A mensagem “Tudo sincronizado com a nuvem” só aparece após uma sincronização com resposta de sucesso.
- O recurso \`progresso-sync-core.js\` concilia módulos concluídos, quizzes e respostas de módulos distintos de Safari e do app da tela inicial. Em caso de duas respostas livres incompatíveis na mesma atividade, exige decisão explícita em vez de descartar uma delas.
- O servidor atual usa **uma conta pessoal**, não um sistema multiusuário. A atualização não altera credenciais, tokens, D1, tabelas, endpoints ou sessões anteriores. O acesso por nome de usuário e senha recupera os mesmos registros.
- Para conferir: conectar o iPhone na tela Nuvem, esperar a confirmação, fechar e reabrir, verificar os módulos concluídos; se instalado na tela inicial, fazer login nessa instalação separadamente uma vez.
- Segurança: não limpar os dados locais antes de confirmar sincronização, nem compartilhar a senha. Em caso de conflito, ler ambas as versões antes de escolher.
- Testes automatizados: \`node --test test-progresso-sync.cjs test-login-retorno.cjs test-sync.cjs test-worker.mjs\`.

## Espaço de estudos (15/11/2026)

A navegação preserva as seções anteriores e acrescenta início, biblioteca e progresso por habilidade. A paleta carvão/verde continua a mesma. As 24 etapas continuam separadas dos 60 componentes planejados; nenhuma disciplina é marcada como concluída pelo nivelamento.

`aprendizagem-core.js` calcula os indicadores a partir dos registros reais. Quiz perfeito significa proficiência; revisão vencida ou último quiz incompleto recomenda reforço. “Dominado” é reservado a avaliações independentes futuras, porque as revisões existentes são autodeclaradas.

A mesma chave de trilha ganha campos opcionais `resume`, `quizDraft`, `history` e `practiceAnswers`. Os campos antigos e desconhecidos são preservados. `resume` guarda ID e seção; `quizDraft` conserva alternativas ainda não enviadas; `history` guarda até 60 tentativas novas por UUID, data e índices dos erros. O histórico antigo da última tentativa continua em `attempts`. O merge combina históricos e exige escolha para respostas incompatíveis. O backend existente aceita esses campos opcionais, sem alteração de tabelas ou credenciais.

`pratica-numerica.js` confere subpartes objetivas de 11 atividades com o parser seguro já existente, unidade indicada e tolerância absoluta explícita. Não avalia justificativas discursivas, fatoração simbólica irrestrita nem desenhos livres. M06 mantém seu componente geométrico. As práticas abertas continuam autoavaliadas e a aprovação continua dependendo de 3/3 no quiz.

O manifesto e Service Worker permitem reabrir o conteúdo já armazenado offline após uma primeira visita online. O cache usa rede primeiro e nunca intercepta o Worker, login ou APIs externas. PDFs são armazenados ao abrir; MathLive e vídeos externos precisam de conexão, com a alternativa textual existente. A atualização do Service Worker aguarda o fechamento de abas anteriores. Não limpar dados locais para atualizar.

### Migração e reversão

Partida: `9cc2cfca6d42d1297fc55419532deaaf5363b4da`. Não há migração D1, alteração do Worker ou escrita nos dados reais do aluno durante QA. Testes usam dados locais de preview e SQLite em memória. Antes de migrações futuras no servidor, exportar D1 e testar restauração; nenhuma migração de servidor foi necessária nesta entrega. Reverter a interface por commit, preservando dados; versões antigas podem ignorar campos novos, por isso não usá-las para editar progresso depois do rollback sem copiar os registros primeiro.

### Limitações verificáveis

- A grade de 60 disciplinas é um plano, ainda não 60 cursos completos.
- Conteúdo existente foi reaproveitado; explicações por distrator, banco maior de exercícios, avaliação simbólica geral e construtor de circuitos continuam pendentes.
- Push não está ativo: o Worker consultado não possui Cron Triggers e só tem DB/TOKEN_HASH; faltam assinatura, VAPID, envio e homologação física. Preferências: 20h30 America/Sao_Paulo, seg-sex, dois dias sem estudo e próximo módulo.
- Safari/iPhone 11 físico, push e recuperação autenticada dos dados reais do aluno precisam de homologação; não foram simulados como testes físicos.

Testes: `node --test test-*.cjs test-worker.mjs` (Node 24). A automação cobre login, sincronização, parser, teclado, preservação legada, indicadores e conferência numérica. QA de navegador no preview cobriu entrada, prática, respostas de quiz, recarga com seleção preservada, 3/3 e abertura da próxima etapa.

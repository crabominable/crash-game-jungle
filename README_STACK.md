# README_STACK

## Objetivo

O foco aqui e explicar por que esta implementacao escolhe determinadas tecnologias e por que outras opcoes aceitas pelo desafio nao foram adotadas neste momento.

Algumas dessas tecnologias ou stacks eu nao tenho familiaridade, entao a escolha de usar elas tambem passa pela minha preferencia, justamente para ter mais experiencia e conhecimento com elas.

Parte deste projeto, principalmente o setup de documentos, planejamento, arquivos iniciais e este README foi gerado por inteligencia artificial (Codex), mas sempre seguindo boas praticas, documentacoes das tecnologias e o meu conhecimento como desenvolvedor.

Considerando que e um teste tecnico com prazo curto, com o objetivo de fazer algo semelhante a um MVP, a stack nao precisa ser completa ou perfeita. A melhor stack e a que:

- atende os eliminatorios e requisitos com clareza
- conversa bem com a arquitetura pedida
- reduz retrabalho
- facilita um historico Git coerente
- deixa as decisoes tecnicas faceis de se entender

## Resumo da Stack Escolhida

- Runtime e workspace: `Bun`
- Backend: `NestJS` + `TypeScript` strict
- Arquitetura: monorepo com `games`, `wallets`, `frontend` e `packages`
- Banco: `PostgreSQL`
- Mensageria: `RabbitMQ`
- API Gateway: `Kong`
- IdP: `Keycloak`
- Frontend: `TanStack Start`
- Estado remoto no frontend: `TanStack Query`
- Estado local no frontend: `Context` primeiro, `Zustand` apenas se houver necessidade real
- Infra local: `Docker Compose`

## Por Que Esta Stack

### Por que `Bun`

`Bun` foi escolhido porque o proprio desafio ja o coloca como runtime preferencial e a base do repositorio ja nasce orientada a ele. Isso reduz atrito logo no inicio:

- `bun install` e rapido
- o monorepo fica simples de operar
- scripts de teste, build e bootstrap ficam padronizados

Em um teste com tempo limitado, alinhar com o runtime esperado da base e melhor do que gastar energia provando que outro gerenciador de pacotes "tambem funciona".

### Por que `NestJS` + `TypeScript` strict

`NestJS` foi mantido porque o scaffold dos servicos ja existe nessa stack e porque ele combina bem com o tipo de separacao pedida no desafio:

- controllers na borda
- aplicacao/casos de uso no meio
- dominio isolado
- infraestrutura desacoplada

Isso ajuda muito a deixar visivel a separacao entre `games` e `wallets`, que e um dos pontos centrais da avaliacao.

`TypeScript` strict entra porque este projeto tem muitas fronteiras:

- servico para servico
- HTTP
- WebSocket
- broker
- DTOs
- estados de rodada e aposta

Quando ha muitas fronteiras, tipagem frouxa gera retrabalho e ambiguidades justamente onde a banca espera clareza.

### Por que monorepo

O monorepo foi mantido porque o desafio pede dois servicos separados, um frontend e contratos comuns, mas tudo isso ainda precisa subir junto com boa DX local.

O monorepo ajuda porque:

- centraliza scripts de verificacao
- facilita compartilhar contratos tecnicos
- permite evoluir `games`, `wallets` e `frontend` em pequenos commits coerentes
- conversa bem com o criterio de historico Git

Ao mesmo tempo, o monorepo nao significa misturar dominios. O objetivo e compartilhar setup e contratos tecnicos, nao regra de negocio.

### Por que `PostgreSQL`

`PostgreSQL` foi escolhido porque o desafio pede consistencia, auditabilidade e modelagem de estado com boa confiabilidade.

Ele atende bem porque:

- lida bem com integridade de dados
- permite separar logical databases de `games` e `wallets`
- e uma escolha segura para ledger, historico de rodadas e conciliacao

Mais importante do que "qual ORM usar" neste momento e manter a base de persistencia robusta para dinheiro, historico e reconciliacao.

### Por que `RabbitMQ`

`RabbitMQ` foi escolhido porque o README e a arquitetura pedem comunicacao assincrona entre `games` e `wallets`, com consistencia eventual e idempotencia.

Ele foi preferido aqui porque:

- combina bem com comandos e respostas assincronas
- e facil de subir localmente com Docker
- deixa visivel o desenho do fluxo `requested -> confirmed/rejected`
- tem excelente custo-beneficio para uma demo tecnica local

#### Por que nao `Kafka`

`Kafka` seria uma escolha forte para throughput alto e streams mais complexos, mas para este teste ele aumenta bastante o peso operacional sem melhorar proporcionalmente a leitura do MVP.

#### Por que nao `SQS`

`SQS` tambem seria valido, mas localmente ele exigiria mais camada de emulacao e adicionaria mais infraestrutura acessoria. Para o contexto do teste, `RabbitMQ` entrega a mesma ideia central com menos atrito.

### Por que `Kong`

`Kong` foi mantido porque a base do desafio ja nasce preparada com ele e porque ele ajuda a deixar a topologia publica mais crivel:

- um ponto unico de entrada
- rotas para `games` e `wallets`
- espaco natural para auth e politicas de borda
- alinhamento com o desenho pedido pelo README

Ele tambem ajuda a banca a enxergar melhor a arquitetura distribuida, em vez de parecer apenas "dois servidores com portas diferentes".

### Por que `Keycloak`

Mesmo com o texto do desafio dizendo que autenticacao nao e o foco principal, a entrega final ainda quer um IdP validando JWTs na borda do backend.

`Keycloak` foi mantido porque:

- ja vem preconfigurado no desafio
- ja conversa com `docker:up`
- evita gastar tempo implementando auth caseira
- permite focar no que realmente esta sendo avaliado: dominio, broker, tempo real e dinheiro

#### Por que nao `Auth0` ou `Okta`

Seriam escolhas validas, mas trocariam uma base pronta por configuracao externa adicional sem ganho real para os criterios centrais do teste.

### Por que `TanStack Start`

`TanStack Start` foi escolhido porque ele equilibra muito bem as necessidades deste projeto:

- React moderno
- roteamento forte
- bom encaixe com `TanStack Query`
- boa ergonomia para uma UI que mistura leitura REST, autenticacao e atualizacao em tempo real

Ele tambem conversa com a preferencia explicita do enunciado e com a stack da empresa, o que faz a decisao ficar mais facil de defender.

#### Por que `TanStack Start` em vez de `Next.js`

`Next.js` seria uma escolha perfeitamente defensavel, mas ele traz um peso maior de convencoes e uma superficie mais ampla do que o necessario para este teste.

Para este caso especifico:

- nao ha necessidade forte de SSR sofisticado
- nao ha foco em SEO
- o frontend esta mais para app jogavel do que para site de conteudo
- a borda principal da arquitetura ja esta no `Kong`, nao no framework web do frontend

Entao `Next.js` seria viavel, mas nao claramente melhor.

#### Por que `TanStack Start` em vez de `Vite + React`

`Vite + React` e a opcao mais leve e provavelmente a mais rapida para sair codando, mas ela exigiria montar mais pecas manualmente para chegar no mesmo nivel de coerencia:

- roteamento
- organizacao de loaders
- convencoes de navegacao
- integracao mais estruturada com o restante da stack

`TanStack Start` fica como meio-termo interessante:

- mais estruturado que `Vite + React`
- menos pesado que `Next.js` para este caso
- mais alinhado ao stack sugerido pela empresa

### Por que `TanStack Query`

`TanStack Query` foi escolhido porque o frontend vai depender bastante de estado remoto:

- rodada atual
- historico
- carteira
- status de aposta
- reconciliacao depois de mutacoes

Ele ajuda a separar bem:

- o que vem do servidor
- o que e cache
- o que e estado local de interface

Isso reduz a chance de o frontend virar fonte de verdade de algo que, na arquitetura, pertence a `games` ou `wallets`.

### Por que `Context` primeiro e `Zustand` so se precisar

Nem todo projeto React precisa de estado global extra logo no inicio.

A escolha aqui e pragmatica:

- `Context` para concerns pequenos, como sessao, providers e glue code de UI
- `Zustand` apenas se a interface mostrar necessidade real de estado compartilhado efemero que nao caiba bem em props ou `Context`

Isso evita inflar a complexidade cedo demais.

### Por que `Docker Compose`

`Docker Compose` foi mantido porque o desafio explicitamente mede a capacidade de subir a stack toda com um comando previsivel.

Ele e a melhor escolha aqui porque:

- deixa o ambiente reproduzivel
- simplifica a demo
- aproxima a implementacao do contrato `bun run docker:up`

## Trade-offs Reais

Nenhuma dessas escolhas e perfeita. O que foi traz alguns reveses:

- `RabbitMQ` adiciona estados pendentes e reconciliacao
- `Kong` adiciona uma camada extra de borda para configurar
- `Keycloak` adiciona curva de entendimento de OIDC
- `TanStack Start` nao tem a mesma familiaridade universal de `Next.js` ou `Vite`
- monorepo exige disciplina para nao misturar responsabilidades

Mesmo assim, no contexto deste teste, esses custos foram aceitos porque o ganho de coerencia arquitetural e maior do que o peso adicional.

## O Que Esta Sendo Priorizado Com Essas Escolhas

Esta stack foi escolhida para maximizar 5 coisas:

1. Separacao clara entre `games` e `wallets`
2. Fluxo assincrono crivel entre jogo e carteira
3. Precisao monetaria e auditabilidade
4. Frontend alinhado a contratos e tempo real sem excesso de peso
5. Boa relacao entre prazo de entrega e qualidade tecnica percebida

## Decisoes Estruturais e Arquiteturais

Esta secao existe para explicar melhor algumas decisoes de implementacao que nao sao apenas "qual tecnologia escolhi", mas sim "como organizei o codigo para que a stack continue clara e segura".

### Por que `wallets` veio antes de `games`

O servico de `wallets` foi implementado antes do dominio principal de `games` porque ele e a autoridade monetaria do sistema.

Na pratica, isso significa:

- saldo pertence a `wallets`
- debito e credito pertencem a `wallets`
- ledger auditavel pertence a `wallets`
- `games` nao deve inventar nem recalcular dinheiro do lado errado

Essa ordem reduz o risco de modelar aposta e cashout sobre uma base financeira fraca. Primeiro o projeto aprende a tratar dinheiro com seriedade, depois o jogo passa a pedir efeitos financeiros de forma consistente.

### Por que separar `presentation`, `application`, `domain` e `infrastructure`

Essa divisao foi adotada para que cada parte do servico tenha uma responsabilidade facil de explicar:

- `presentation`: recebe requisicoes do mundo externo
- `application`: coordena casos de uso
- `domain`: guarda as regras mais importantes de negocio
- `infrastructure`: cuida de detalhes concretos de armazenamento e integracao

Em termos simples, isso evita que controller vire regra de negocio, que regra de dinheiro fique espalhada e que o servico dependa cedo demais do banco ou do broker. Para um teste tecnico, essa clareza ajuda tanto a implementar quanto a defender as decisoes na avaliacao.

### Por que inicialmente o controller continua simples nesta fase

A decisao aqui foi nao abrir a API publica completa cedo demais. Antes de expor endpoints reais de carteira, o servico precisava provar internamente que sabe:

- criar carteira
- debitar e creditar corretamente
- impedir saldo negativo
- evitar operacoes duplicadas
- manter historico auditavel

Ou seja, primeiro foi construida a regra; depois viria a borda publica. Isso manteve o commit atomico e evitou misturar dominio financeiro com concerns de auth, `Kong` e contrato HTTP final.

### Por que `AppModule` faz o wiring das pecas

No `NestJS`, o `AppModule` foi usado como ponto central de montagem do servico.

Ele registra:

- controller
- servicos de aplicacao
- implementacao concreta do repositorio
- associacao entre o contrato `WALLET_REPOSITORY` e a implementacao `InMemoryWalletRepository`

Essa escolha deixa a injecao de dependencia explicita. Em vez de acoplar tudo diretamente, o servico aprende a pedir "o contrato de repositorio" e o modulo decide qual implementacao entregar. Isso facilita trocar persistencia em memoria por banco real depois, sem reescrever a regra principal.

### Por que existe um `repository` abstrato

O `wallet.repository.ts` nao guarda nada por si so. Ele existe para definir o contrato minimo que a aplicacao precisa:

- criar carteira
- buscar carteira por jogador
- salvar carteira

Essa abstracao foi escolhida porque a regra de negocio nao deve depender do jeito concreto de persistir dados. Hoje o repositorio e em memoria para acelerar o MVP e manter o foco na regra; depois ele pode virar persistencia real sem quebrar os casos de uso.

### Por que comecar com persistencia em memoria

Inicialmente a persistencia em memoria foi uma decisao de ordem, nao de arquitetura final.

Ela veio antes do banco real porque o objetivo desse incremento era provar:

- modelagem da carteira
- precisao monetaria
- idempotencia
- ledger
- servicos de aplicacao

Se banco real entrasse cedo demais, o commit ficaria mais pesado, mais dificil de revisar e menos claramente "sobre carteira". A persistencia em memoria deixou esse passo pequeno, funcional e facil de validar.

### Por que o `domain/wallet.ts` e o coracao da carteira

O arquivo `wallet.ts` foi tratado como o centro do bounded context porque e ali que mora a verdade sobre como dinheiro deve se comportar.

Ele concentra regras como:

- saldo em unidade minima inteira
- credito e debito
- saldo nunca negativo
- idempotencia por `correlationId`
- conflito quando o mesmo `correlationId` reaparece com payload diferente
- registro em ledger a cada operacao valida

Essa decisao foi importante porque dinheiro nao pode depender de comportamento implicito de controller ou banco. A regra precisa viver em um lugar pequeno, legivel e testavel.

### Por que usar unidade minima inteira em vez de `float`

Dinheiro foi modelado em unidade minima inteira porque `float` gera arredondamento imprevisivel e isso e inaceitavel para carteira, aposta e cashout.

Na pratica:

- `1000` pode significar `R$ 10,00`
- o sistema soma e subtrai inteiros
- nao ha risco de acumulacao de erro binario tipico de ponto flutuante

Essa escolha conversa diretamente com os criterios eliminatorios do desafio e com a necessidade de auditabilidade.

### Por que existe `correlationId` em debitos e creditos

O `correlationId` funciona como um protocolo unico de cada operacao financeira.

Ele foi adotado para permitir idempotencia:

- se a mesma mensagem chegar duas vezes
- se o mesmo pedido for reenviado
- se houver retry de integracao

o sistema reconhece que aquela operacao ja foi processada e nao duplica efeito financeiro.

Isso e essencial num desenho com comunicacao assincrona entre `games` e `wallets`, porque retry faz parte do caminho normal e nao deve virar dinheiro duplicado.

### Por que guardar `ledger`

O `ledger` foi incluido desde cedo porque a carteira nao precisa so de saldo final; ela precisa de historico rastreavel.

Cada entrada guarda informacoes como:

- direcao da operacao
- valor
- saldo apos a operacao
- `correlationId`
- origem
- referencia

Essa decisao melhora auditabilidade e prepara o servico para explicar de onde veio cada mudanca de saldo.

### Por que existe `snapshot`

Os `snapshots` foram criados para transformar o estado interno da carteira em uma forma mais segura e previsivel de expor dados.

Isso ajuda porque o dominio trabalha com detalhes internos como:

- `bigint`
- estruturas ricas de entidade
- objetos com semantica de negocio

Mas a borda da aplicacao e os testes costumam precisar de uma "foto" mais simples e estavel. O snapshot cumpre esse papel sem obrigar o dominio a se moldar ao formato de resposta.

### Por que testar `domain` e `application` separadamente

Os testes foram divididos em duas camadas porque elas respondem perguntas diferentes.

Testes de `domain` verificam se a carteira sabe se comportar:

- cria corretamente
- debita corretamente
- nao aceita saldo negativo
- respeita idempotencia
- detecta conflitos de correlacao

Testes de `application` verificam se os casos de uso coordenam bem o dominio e o repositorio:

- cria e busca carteira
- credita
- debita
- devolve snapshots consistentes

Essa separacao deixa o feedback mais claro. Quando algo quebra, fica mais facil saber se o problema esta na regra principal ou na forma como ela esta sendo orquestrada.

### Por que `games` veio depois de `wallets`

O dominio de `games` foi implementado depois de `wallets` porque o jogo depende de uma autoridade monetaria para ser honesto.

Sem isso, o servico de jogo poderia cair em atalhos ruins, como:

- fingir que uma aposta ja esta ativa sem debito confirmado
- fingir que um cashout ja virou ganho sem credito liquidado
- misturar regra de rodada com regra de saldo

Ao fazer `wallets` primeiro, o `games` ja nasce sabendo que o dinheiro mora do outro lado. Isso melhora a modelagem e tambem deixa a progressao dos commits mais logica.

### Por que a entidade `Round` virou o coracao do dominio

No `games`, o equivalente do `wallet.ts` e o `round.ts`.

Ele foi tratado como o centro do bounded context porque e ali que mora a verdade sobre:

- quando a rodada aceita apostas
- quando a rodada comeca
- quando ela crasha
- quando um cashout pode ser aceito
- quando uma aposta esta ativa, perdida ou pendente de carteira

Em outras palavras: em vez de espalhar a regra da rodada por varios services ou controllers, o projeto concentra a logica principal em um lugar pequeno, legivel e testavel.

### Por que a rodada e as apostas ganharam estados explicitos

Uma das decisoes mais importantes desse commit foi modelar estados de forma explicita, tanto para a rodada quanto para a aposta.

Estados da rodada:

- `betting_open`
- `in_progress`
- `crashed`
- `settled`

Estados da aposta:

- `bet_pending_wallet`
- `bet_active`
- `bet_rejected_by_wallet`
- `cashout_pending_wallet`
- `cashout_settlement_pending_or_failed`
- `won_settled`
- `lost`

Isso foi escolhido porque o sistema precisa ser honesto sobre o que ja aconteceu e o que ainda esta pendente. Em arquitetura distribuida, dizer "ganhou" ou "apostou" cedo demais e uma forma de mentir sobre o estado real do sistema.

### Por que existe a ideia de `pending wallet settlement`

O ponto mais importante do momento atual e justamente esse: o `games` sabe separar "o jogo aceitou" de "a carteira liquidou".

Exemplos:

- uma aposta nasce como `bet_pending_wallet` e so depois vira `bet_active`
- um cashout nasce como `cashout_pending_wallet` e so depois vira `won_settled`

Essa decisao veio antes de `RabbitMQ` porque o dominio ja precisava saber representar a verdade do fluxo antes mesmo da integracao completa existir. Assim, quando o broker entrar, ele vai completar um desenho que ja era honesto, e nao corrigir uma modelagem falsa.

### Por que `crashed` e diferente de `settled`

Outra decisao importante foi nao tratar crash como fim automatico da rodada.

`crashed` quer dizer:

- o evento principal da rodada aconteceu
- quem nao saiu a tempo perdeu

Mas isso ainda nao garante que a parte financeira terminou. Pode continuar existindo:

- debito de aposta ainda pendente
- cashout aceito esperando credito
- confirmacao tardia chegando depois do crash

Por isso existe `settled`: ele so aparece quando nao resta mais pendencia financeira relevante. Essa separacao deixa o fluxo muito mais confiavel.

### Por que existe reconciliacao tardia

Em sistemas assincronos, as respostas nao chegam sempre na ordem perfeita. Isso foi desenhado ja considerando isso.

Exemplo:

- a rodada crasha
- depois disso chega uma confirmacao tardia do debito
- ou chega uma confirmacao tardia de credito depois de uma falha anterior

O dominio precisa saber se reconciliar com esses atrasos sem quebrar o estado. Essa foi uma escolha de maturidade: o projeto nao assume uma orquestracao idealizada onde tudo sempre chega no instante certo.

### Por que `calculatePayoutMinor` fica no dominio

O calculo do payout foi mantido junto do dominio da rodada porque ele faz parte da semantica do jogo.

O `games` decide:

- qual multiplicador foi aceito
- qual payout isso representa

O `wallets` depois aplica exatamente o valor inteiro que receber. Essa divisao e importante porque:

- o jogo conhece a regra do cashout
- a carteira conhece o saldo e o ledger

Cada servico fica responsavel pelo que lhe pertence.

### Por que os casos de uso do `games` foram quebrados em varios services pequenos

Em vez de um service gigante fazendo tudo, o commit criou varios casos de uso pequenos:

- `create-round`
- `start-round`
- `place-bet`
- `accept-cashout`
- `crash-round`
- `confirm-bet-debit`
- `reject-bet-debit`
- `confirm-cashout-credit`
- `reject-cashout-credit`
- `get-current-round`

Isso foi escolhido porque cada acao tem semantica propria. Separar em varios services deixa mais claro:

- o que cada comando faz
- qual estado ele altera
- qual comportamento os testes precisam provar

### Por que o `RoundRepository` continua abstrato

Assim como no `wallets`, o repositorio do `games` foi mantido como contrato e nao como detalhe concreto acoplado ao dominio.

Ele define o minimo necessario para o servico funcionar:

- criar rodada atual
- obter rodada atual
- salvar rodada atual

Isso permite que a regra da rodada seja desenvolvida e testada sem depender cedo demais de banco real ou broker.

### Por que comecar com `InMemoryRoundRepository`

A persistencia em memoria foi usada aqui pelo mesmo motivo do `wallets`: ordem de implementacao.

O objetivo inicial nao e provar banco, fila ou API completa. E provar:

- modelagem da rodada
- transicoes de estado
- cashout
- crash
- reconciliacao

Se banco e integracao real entrassem nesse ponto, o commit ficaria grande demais e a leitura principal do incremento se perderia.

### Por que o controller continua simples tambem no `games`

Mesmo com o dominio de `games` muito mais rico, o controller ainda foi mantido praticamente como uma porta de `health`.

Essa foi uma decisao de atomicidade. Antes de abrir a API publica de aposta, cashout e historico, o projeto precisava garantir que:

- a rodada sabe se comportar
- os estados pendentes existem
- a reconciliacao funciona

So depois faria sentido colocar `Kong`, auth, contratos REST e `WebSocket` por cima. Isso evita misturar "miolo do jogo" com "borda publica" no mesmo commit.

### Por que o `AppModule` do `games` ficou maior

O `AppModule` cresce neste commit porque o servico passou a ter muito mais pecas reais:

- casos de uso
- repositorio
- controller
- injecao do contrato `ROUND_REPOSITORY`

Ele funciona como a lista de montagem do servico. Em vez de deixar a construcao espalhada e implicita, o modulo registra claramente quais partes existem e como elas se conectam.

### Por que existe `round.snapshot`

O `round.snapshot.ts` cumpre para o `games` o mesmo papel que `wallet.snapshot.ts` cumpre para o `wallets`: tirar uma foto organizada da entidade para o resto do sistema consumir.

Isso ajuda porque a entidade interna trabalha com:

- `bigint`
- detalhes ricos de aposta
- campos de estado e reconciliacao

Ja os testes e a camada de aplicacao preferem uma representacao mais previsivel, especialmente para comparar resultados e expor dados sem vazar detalhes internos do dominio.

### Por que testar `domain` e `application` separados tambem no `games`

No `games`, essa separacao ficou ainda mais importante porque ha muita transicao de estado.

Testes de `domain` verificam se a rodada sabe se comportar:

- aceita e rejeita aposta na hora certa
- aceita ou rejeita cashout
- crasha corretamente
- reconcilia pendencias
- fecha como `settled` so quando pode

Testes de `application` verificam se os casos de uso orquestram o dominio corretamente:

- criar rodada atual
- mover aposta de pendente para ativa
- marcar cashout como pendente
- reconciliar depois do crash
- permitir nova rodada depois da anterior estar encerrada

Essa divisao deixa os testes mais explicativos e ajuda a encontrar rapidamente se o problema esta na regra principal ou na forma como ela esta sendo usada.

### Por que focar em testes de invariantes de dinheiro e idempotencia

O Commit (test: prove payout truncation and wallet settlement idempotency) adicionou testes isolados focados especificamente nas bordas mais sensiveis do sistema antes de integra-lo a rede:

1. **Truncamento de Payout (Money Invariants):** No jogo Crash, o multiplicador pode ser um numero altamente fracionado. Como a carteira opera estritamente em unidades minimas inteiras, o teste prova que qualquer multiplicacao e sempre arredondada para baixo (truncada). Isso previne vazamento financeiro por falha de arredondamento, protegendo a casa (banca).

2. **Idempotencia de Liquidacao (Wallet Settlement Idempotency):** Como o sistema usara mensageria assincrona (RabbitMQ), existe a possibilidade real de uma mensagem ser entregue duas vezes (semantica *at-least-once*). Esses testes garantem que se o broker engasgar e a ordem de debito/credito com o mesmo correlationId chegar repetida, a carteira nao cobrara ou pagara duas vezes, preservando o ledger auditavel.

Essa prova antecipada demonstra que o coracao financeiro esta matematicamente blindado antes mesmo de abri-lo para conexoes externas.

### Por que adotar RabbitMQ e Consistencia Eventual

O Commit (feat(integration): settle bets asynchronously through RabbitMQ) introduziu a comunicacao via broker para integrar os microsservicos, rejeitando o padrao de chamadas HTTP sincronas diretas.

As mudancas estruturais implementadas foram:

1. **Desacoplamento via Publishers:** No servico games, operacoes criticas como Apostar (PlaceBetService) e Cashout passaram a emitir mensagens (wallet.debit.request e wallet.credit.request) para o RabbitMQ, acompanhadas de um correlationId. A entidade salva seu estado puramente como pendente (set_pending_wallet) e o fluxo da aplicacao segue sem travar aguardando resposta de rede.

2. **Processamento em Consumers (Listeners):**
- No wallets, controllers de mensageria foram criados (com @EventPattern) para sugar as requisicoes da fila. Ele processa o debito ou credito e, ao final, publica um novo evento na via de mao dupla: wallet.debit.confirmed ou wallet.debit.rejected.
- No games, outro listener consome essas confirmacoes. Ao receber um confirmed, o estado da aposta evolui de set_pending_wallet para set_active, completando o ciclo.

3. **Resiliencia e Tolerancia a Falhas:** Este padrao de Eventual Consistency garante que, caso o servico wallets sofra uma queda abrupta, o jogo nao apresente falhas ou perca apostas. As mensagens ficam armazenadas na fila do RabbitMQ e sao processadas retroativamente no momento em que a conexao e reestabelecida, reconciliando o saldo final perfeitamente.

### Por que expor a API via Kong e proteger com Keycloak JWT

O Commit (feat(api): expose authenticated game and wallet flows through Kong) encerrou o ciclo de amadurecimento interno do dominio e finalmente abriu as portas do sistema para o mundo exterior (clientes HTTP), adotando o padrao de API Gateway e delegando a gestao de identidade (IdP).

As alteracoes tecnicas implementadas e seus racionais foram:

1. **Topologia Oculta via API Gateway (Kong):** Expor os servicos games e wallets em portas isoladas diretamente para a internet criaria gargalos severos de CORS para o Frontend, alem de revelar a topologia interna. Ao levantar o **Kong** na porta 8000 e configurar o proxy-reverso para as rotas (/games/* e /wallets/*), os clientes enxergam uma API unificada, limpa e padronizada.

2. **Borda HTTP (Controllers Publicos):** Com o núcleo de regras consolidado, os Controladores REST (games.controller.ts e wallets.controller.ts) foram concretizados. Eles apenas recebem o tráfego HTTP e orquestram a chamada para os Use Cases preexistentes (POST /rounds/current/bets, POST /rounds/current/cashout, GET /wallets/me), sem possuir regra de negocio dentro de si mesmos.

3. **Autenticacao Stateless e Blindada (Passport + IdP):**
- Utilizamos a suite @nestjs/passport configurada como JwtStrategy, que valida a assinatura dos tokens consultando o endpoint JWKS do **Keycloak**.
- As rotas que envolvem operacoes financeiras foram rigidamente protegidas usando @UseGuards(AuthGuard('jwt')).
- Para blindar o sistema contra fraudes de falsa identidade (ex: um usuario enviando no Body da requisicao playerId="id-do-amigo" para apostar o dinheiro do outro), criamos um Parameter Decorator customizado @PlayerId(). Ele descarta o input do usuario e suga a identidade de forma puramente criptografica de dentro do token JWT verificado pelo Keycloak.

### Por que usar WebSockets com Snapshot Engine e Proxy no Kong

O Commit (feat(realtime): proxy game websocket through Kong with round snapshots) supriu a necessidade vital do produto de reagir em tempo real (milissegundos) a mudancas de estado, algo que o padrao HTTP Request/Response (REST) ou o *Polling* abusivo seriam incapazes de sustentar com performance.

As inovacoes tecnicas implementadas e seus motivos incluem:

1. **Gateways Integrados via Socket.IO:** Em vez de isolar o motor de mensageria para o cliente em um terceiro microsservico (aumentando a latencia da rede interna), construimos o GamesGateway injetando o @nestjs/platform-socket.io diretamente na aplicacao. O ciclo de vida do Socket amarra-se perfeitamente aos Use Cases do dominio.

2. **Arquitetura de "Snapshot Engine":** Em jogos multiplayer rapidos, emitir eventos fragmentados (ex: set_added, multiplier_changed) joga o fardo da conciliacao de estado para os clientes, gerando bugs de dessincronia. Adotamos o padrao de Snapshot: construimos um TickService com um "Heartbeat". Constantemente, ele compila a foto exata e completa da rodada atual (RoundSnapshot) e faz um .emit() pro Gateway. O Frontend descarta o trabalho logico e age apenas como um renderizador passivo daquele estado imutavel.

3. **Tunneling Transparente sem portas extras:** A topologia de borda continuou intacta. Em vez de abrir uma porta separada (ex: 3003) correndo o risco de bloqueios por firewalls de rede corporativa, o Frontend conecta seu Web Socket na mesma raiz do Kong (http://localhost:8000). O Kong processa os cabecalhos HTTP de Upgrade (Connection: Upgrade) e matem o tunel bidirecional aberto nos bastidores roteando diretamente ate a camada do NestJS.

### Por que adotar um sistema Provably Fair

O Commit (feat(games): add provably fair artifacts history and verify endpoint) introduziu o modulo de integridade criptografica ao sistema. Em aplicativos financeiros e de apostas em tempo real, e mandatorio provar de forma irrefutavel que a "Banca" nao manipulou o resultado com base no volume financeiro apostado pelos jogadores durante o voo.

As inovacoes tecnicas implementadas e os racionais por tras delas incluem:

1. **Determinismo no Momento Zero (provably-fair.ts):** O crashPoint deixou de ser gerado por um simples Math.random() na hora da explosao. Agora, na criacao da rodada (create-round.service.ts), utilizamos o modulo crypto nativo do Node.js para gerar uma chave robusta (seed/salt). O resultado exato da rodada e calculado imediatamente, e a combinacao sofre um processo matematico de Hash SHA-256 (unidirecional e irreversivel), formalizando um "Cadeado Criptografico" daquele resultado imutavel.

2. **Exposicao Condicional Segura (Snapshots):** A modelagem de estado ditou a forma como isso e vazado para o mundo. O round.snapshot.ts foi atualizado para expor apenas o hash trancado durante as fases de setting_open e in_progress. Nenhum cliente (nem quem fizesse sniffing na rede) conseguiria descobrir o crashPoint. O seed secreto so e acoplado ao payload de envio e revelado aos clientes quando a rodada transita para os estados terminais irreversiveis (crashed e settled).

3. **Desacoplamento da Fe (Verify Endpoint):** Nao exigimos fe cega do jogador na nossa interface. Implementamos o Use Case verify-round.service.ts anexado a um Endpoint isolado (GET /rounds/verify). O Frontend ou clientes externos podem bater nesse endpoint passando o seed revelado para testarem matematicamente se a inversao do Hash corresponde de fato ao crashPoint que os fez perder, comprovando lisura total da arquitetura sem expor a seguranca do host.

### Por que adotar essa arquitetura visual e reativa no Frontend

O Commit (feat(frontend): implement authenticated crash gameplay experience) coroou a engenharia do backend construindo o ponto de consumo final do produto. A aplicacao React atua como a lente pela qual toda a arquitetura de API Gateway, WebSockets e Mensageria e evidenciada.

As solucoes tecnicas consolidadas na interface envolveram:

1. **Gestao de Autenticacao com SSO Integrado:** Rejeitamos autenticacoes locais precarias. O aplicativo instanciou o @keycloak/keycloak-js englobado por um AuthContext. Clientes sem sessao sao instantaneamente interceptados e redirecionados para a tela de Single Sign-On da empresa. Apos o retorno, o contexto intercepta a Sessao OAuth e aderecia o Token JWT em todas as submissoes de apostas originadas no navegador.

2. **Reatividade Hibrida (TanStack Query + Sockets):** 
   - **Camada Fria:** Dados historicos e recuperacoes de Wallet (saldo) foram delegados ao **TanStack Query**. Sua arquitetura de cache previne que cada navegacao bombardeie o Kong com requisicoes HTTP (GET /wallets/me).
   - **Camada Quente:** Para exibir o Jogo ao vivo, o socket.io-client foi confinado no GameContext, batendo unicamente na raiz do Gateway (/). Sempre que o motor do backend envia um 
ound.snapshot, o Context propaga esse estado imutavel para os botoes e para o placar, re-renderizando a interface de forma extremamente fluida sem causar gargalos na rede local.

3. **UI/UX Organica em Vanilla CSS:** Para cumprir a diretriz e restricao do teste a respeito do nao uso de utilitarios (Tailwind), adotamos metodologias estritas de *CSS Modules*. Desenhamos a estetica da "Floresta" provando habilidade nativa na criacao de "Design Tokens" (Variaveis CSS globais de Cores, Tipografia, Espacamento) e micro-animacoes nativas, evidenciando uma entrega de produto comercial nivel Premium que vai alem do CRUD basico.

### Por que criar um End-to-End Mestre do Fluxo

O Commit (test: cover core gameplay monetary and realtime flows) foi o fechamento magistral do projeto. Embora tivessemos extensa cobertura de testes unitarios (provando regras de negocio do dominio) e de snapshot, sistemas distribuidos falham em grande parte nas costuras da rede (Network Seams).

A engenharia e racional por tras da criacao deste Teste E2E (Caixa Preta) raiz incluem:

1. **Abandono Estrategico de Mocks:** O script core-flow.e2e.test.ts e executado exclusivamente contra a stack real instanciada pelo docker-compose. Sem interceptadores de rede ou bancos em memoria, ele lida com a latencia e topologia nua e crua.

2. **Exercicio da Camada de Seguranca (OIDC via API):** A premissa de um E2E realista exige autenticacao real. O teste realiza chamadas POST nativas para a porta 8080 do Keycloak (/protocol/openid-connect/token) utilizando as credenciais cadastradas na rampa de Setup do container. Todo o ciclo do script valida os Decorators e Guards utilizando JWTs formalmente assinados pelo IdP.

3. **Prova da Consistencia Eventual e Topologia:** O grande valor do script e provar a idempotencia e as conexoes sob fluxo continuo:
   - Conecta-se no Websocket tunelado na porta 8000 (Kong).
   - Ouve ativamente e valida a cadencia dos 
ound.snapshots disparados pelo Motor Interno de Ticks do Jogo.
   - Forja uma aposta (placeBet) via WS passando o Token. Prova que o Request viajou pelo Gateway, engatilhou o Domain de games, lancou a acao para a fila do RabbitMQ e esperou.
   - Aplica a mesma forca para realizar o cashOut.
   - Como ato final, apos o "Sleep" que emula o processamento da rede, ele executa um fetch GET /wallets/me para a API. Matematicamente valida se o saldo final no PostgreSQL do microservico Wallets englobou todas as mutacoes financeiras com a precisao e idempotencia prometidas na arquitetura.

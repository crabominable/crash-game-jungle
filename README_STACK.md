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

Ele tambem conversa com a preferencia explicita do enunciado e com a stack da empresa.

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

## Arquivos iniciais no frontend gerado pelo TanStack Start

Documentação de referência: https://tanstack.com/start/latest/docs/framework/react/build-from-scratch

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

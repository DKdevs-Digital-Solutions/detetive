# Recepção inteligente local — versão 3

Esta versão pode ser identificada pelo selo **RECEPÇÃO LOCAL · SEM TOKENS** no topo da tela de inatividade.

## Dois comportamentos diferentes

### 1. Pessoa passando

Quando uma silhueta atravessa o campo da câmera e sai sem permanecer parada, o sistema mostra corações e reproduz apenas uma saudação curta, por exemplo:

> Bem-vindo à Feira de Ciências!

A saudação acontece no máximo uma vez a cada 10 segundos para não criar excesso de falas em corredores movimentados.

### 2. Pessoa parada próxima ao totem

Quando uma pessoa ocupa a região central da câmera, aparenta estar próxima e permanece estável por cerca de 2,6 segundos, o sistema troca para o chamariz de participação:

> Ei, você! Topa investigar uma notícia comigo? Toque na tela e participe do desafio Detetive IA.

O convite muda o visual para verde, exibe brilhos e destaca **Aceitar o desafio**. Um mesmo visitante não recebe o convite repetidamente enquanto continua diante do totem.

## Sem consumo de tokens por visitante

As saudações e os convites:

- são frases fixas com três variações de cada tipo;
- usam a voz `SpeechSynthesis` instalada no navegador/sistema operacional;
- não chamam `/api/tts`;
- não chamam ElevenLabs, Anthropic, OpenAI ou outra IA generativa;
- não enviam quadros da câmera ao servidor.

A IA e a voz neural continuam disponíveis nas atividades interativas do projeto, mas não são usadas para cumprimentar cada pessoa que passa.

## Como a distância é estimada

Uma webcam comum não mede metros diretamente. O projeto estima proximidade pelo tamanho da silhueta, posição no quadro e estabilidade. Os valores atuais foram preparados para uma pessoa centralizada a aproximadamente 1 metro, mas dependem do campo de visão e da altura da câmera.

Os limiares ficam no arquivo:

```text
src/hooks/usePresenceDetection.ts
```

Principais constantes:

```ts
const NEAR_HEIGHT_RATIO = 0.48;
const NEAR_WIDTH_RATIO = 0.34;
const NEAR_FOREGROUND_RATIO = 0.105;
```

Para exigir que a pessoa chegue mais perto, aumente esses valores. Para reconhecer uma pessoa mais distante, diminua-os em passos pequenos, como `0.02`.

## Instalação recomendada da câmera

- Altura: aproximadamente 1,35 m a 1,65 m.
- Direção: apontada para o espaço imediatamente à frente do totem.
- Evite enquadrar televisores, janelas com reflexo ou corredores inteiros.
- Deixe a frente do totem vazia durante os primeiros segundos de calibração.
- Use HTTPS ou `localhost`, pois o navegador bloqueia a câmera em HTTP comum.

## Áudio automático no Chromium

Para permitir a fala antes do primeiro toque:

```bash
chromium --kiosk --autoplay-policy=no-user-gesture-required https://SEU-ENDERECO
```

No Windows com Chrome:

```text
chrome.exe --kiosk --app=https://SEU-ENDERECO --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required
```

## Versão 4 — passagem silenciosa e respostas curtas

- Pessoas que apenas passam recebem saudação visual, sem reprodução de voz.
- O convite falado permanece somente para quem para diante do totem.
- O contexto do assistente limita respostas a 1–3 frases e até 60 palavras.
- O limite de geração foi reduzido para evitar falas cansativas.
- Respostas do modo offline e o diagnóstico falado do analisador também foram encurtados.

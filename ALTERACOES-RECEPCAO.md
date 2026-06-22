# Ajustes do modo de recepção

Esta versão pode ser identificada imediatamente pelo selo **MODO RECEPÇÃO ATIVO** no topo da tela inicial de inatividade.

## Alterações aplicadas

- O projeto inicia com a tela de inatividade aberta.
- A câmera é iniciada nessa tela e detecta movimento localmente.
- Ao detectar a chegada de uma pessoa, o avatar exibe corações, muda o fundo e mostra uma mensagem de boas-vindas à Feira de Ciências.
- A saudação pode acontecer novamente após o intervalo de segurança, permitindo receber visitantes diferentes.
- O estado da câmera agora fica visível: ativa, preparando, bloqueada ou incompatível.
- Há um botão para solicitar novamente a permissão quando ela for negada.
- Reconhecimento de voz, comandos globais e gestos ficam bloqueados durante qualquer leitura ou resposta.
- O mecanismo de voz nativo usado no analisador também participa do bloqueio global.
- O checklist passou a usar uma fila sequencial: introdução, critérios 1 a 10 e encerramento.
- A introdução não usa mais temporizador fixo e o primeiro critério só começa no término real do áudio.

## Requisitos da câmera

Navegadores permitem câmera apenas em `https://` ou em `http://localhost`. Ao abrir por um IP local usando HTTP, a própria tela mostrará que HTTPS é necessário.

## Áudio automático no totem

Para permitir voz antes do primeiro toque no Chromium em modo quiosque, inicie o navegador com:

```bash
chromium --kiosk --autoplay-policy=no-user-gesture-required https://SEU-ENDERECO
```

Sem essa opção, a recepção visual funciona normalmente e a fala bloqueada é repetida depois do primeiro toque.

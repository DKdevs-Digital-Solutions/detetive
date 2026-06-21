# Correção do envio de certificados pelo Baileys

## Causas encontradas

1. **O Baileys não era iniciado junto com o totem.**
   A conexão só começava quando alguém abria `/api/whatsapp`, normalmente pelo painel administrativo. Depois de reiniciar o servidor, a emissão direta do certificado encontrava o estado `idle` e retornava `whatsapp-not-connected`.

2. **Os erros reais de conexão eram ocultados.**
   O logger do Baileys estava em `silent` e o evento `connection.update` não gravava o erro recebido em `lastDisconnect`. O painel permanecia em “Conectando...” ou exibia uma mensagem genérica.

3. **O build de produção falhava.**
   O `tsconfig.json` usava `target: es5`, mas a rota do certificado utilizava regex Unicode. Outros erros TypeScript antigos também apareceram depois que o primeiro foi corrigido.

4. **A sessão precisa de armazenamento persistente.**
   O diretório `.baileys_auth` deve permanecer no computador do totem. Em Docker, monte `BAILEYS_AUTH_DIR` em um volume. Não use uma função serverless para manter esta conexão WebSocket.

5. **`pino` era usado sem estar declarado diretamente.**
   Funcionava apenas porque vinha como dependência transitiva do Baileys. Agora está no `package.json`.

## Alterações aplicadas

- O frontend inicia `/api/whatsapp` assim que o totem abre.
- A emissão do certificado também tenta inicializar e aguarda a conexão por até 10 segundos.
- O erro real de desconexão é armazenado e exibido no painel.
- Reconexão automática com proteção contra timers duplicados.
- Sessão configurável por `BAILEYS_AUTH_DIR`.
- Validação do retorno de `sendMessage` pelo `messageId`.
- Nome do arquivo PDF sanitizado sem regex incompatível com ES5.
- `target` alterado para `es2017`.
- `pino` adicionado como dependência direta.
- Build completo validado com `npm run build`.

## Como executar

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra o painel administrativo, escaneie o QR uma vez e confirme que aparece **Conectado**. O diretório configurado em `BAILEYS_AUTH_DIR` guardará a sessão.

Produção local/VPS:

```bash
npm run build
npm start
```

## Docker

Exemplo de persistência:

```yaml
services:
  detetive-ia:
    build: .
    environment:
      BAILEYS_AUTH_DIR: /app/data/baileys-auth
    volumes:
      - baileys_auth:/app/data/baileys-auth

volumes:
  baileys_auth:
```

## Segurança

O arquivo original continha `.env.local` com chaves privadas. Ele foi removido do pacote corrigido. Não envie `.env.local` em ZIPs e não o versione no Git.

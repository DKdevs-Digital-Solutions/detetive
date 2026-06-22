# Deploy do Totem — Detetive IA

O app tem **duas partes**:

1. **Servidor** (Next.js + Baileys) — roda em Docker, atrás do Traefik (HTTPS).
2. **Navegador em modo kiosk** — renderiza a UI e usa **câmera, microfone e áudio**. Roda na **máquina do totem**.

> ✅ Com **HTTPS** (Traefik + Let's Encrypt), câmera/microfone/voz funcionam **mesmo por rede** —
> basta o totem abrir `https://SEU_DOMINIO`. (Sem HTTPS, só funcionaria em `localhost`.)

---

## 1. Subir no GitHub (sem vazar segredos)

O `.gitignore` já ignora `.env`, `.env.local` e `.baileys_auth/`. **Confira antes de commitar** que suas chaves não vão junto — só o `.env.example` (sem valores) deve ir.

```bash
git init
git add .
git commit -m "Detetive IA"
git branch -M main
git remote add origin https://github.com/SEU_USER/detetive-ia.git
git push -u origin main
```

---

## 2. Pré-requisitos no servidor

1. **DNS**: um registro A do seu domínio (ex.: `detetive.seudominio.com.br`) apontando para o IP do servidor.
2. **Portas 80 e 443** abertas (Let's Encrypt valida pela 80).
3. **Rede Docker compartilhada** (uma vez):
   ```bash
   docker network create traefik
   ```

---

## 3. Traefik (se ainda não tiver um)

No Portainer: **Stacks → Add stack** → cole o `docker-compose.traefik.yml` → defina `ACME_EMAIL` → Deploy.
(Se você já tem um Traefik com um certresolver, pule esta etapa e use o nome do seu resolver/rede.)

---

## 4. App no Portainer (a partir do GitHub)

**Stacks → Add stack → Build method: Repository**
- Repository URL: seu repo do GitHub
- Compose path: `docker-compose.yml`
- **Environment variables** (preencha com os valores reais):
  - `DOMAIN` = seu domínio
  - `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`
  - ajustes de voz: `ELEVENLABS_STABILITY`, `ELEVENLABS_SIMILARITY`, `ELEVENLABS_STYLE`, `ELEVENLABS_SPEED`, `ELEVENLABS_SPEAKER_BOOST`, `ELEVENLABS_OUTPUT_FORMAT`, `ELEVENLABS_LANGUAGE_CODE`
  - `ADMIN_PASSWORD`, `CERT_EVENT_NAME`, `CERT_ORG_NAME`

Deploy. O Traefik emite o certificado e publica em `https://SEU_DOMINIO`.
O volume `baileys_auth` mantém a sessão do WhatsApp entre reinícios (não reescaneia o QR).

> Atenção: os nomes `traefik` (rede) e `letsencrypt` (certresolver) no `docker-compose.yml`
> precisam bater com os do seu Traefik.

---

## 5. Navegador kiosk (na máquina do totem)

### Windows (Chrome/Edge)
```
chrome.exe --kiosk --app=https://SEU_DOMINIO --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required --start-fullscreen
```
- `--use-fake-ui-for-media-stream`: concede câmera/microfone sem pop-up.
- Atalho na pasta **Inicializar** (`shell:startup`) para abrir no boot.
- Gire o monitor para **vertical** nas configurações de vídeo.

### Linux (Chromium)
```bash
chromium --kiosk --app=https://SEU_DOMINIO \
  --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required
```

---

## 6. Configuração no app (no totem)
- **Menu de ajustes**: segure o logo por 3s (sem teclado).
- **Conectar WhatsApp**: menu → seção WhatsApp → escaneie o QR uma vez.
- **Inatividade / descanso de tela**: ajustável no menu.
- O app precisa de **internet** (Anthropic, ElevenLabs e MediaPipe via CDN).

---

## Observações
- O `logger` é só em memória — estatísticas zeram ao reiniciar o container (não persistem).
- Para atualizar: faça `git push` e, no Portainer, **Pull and redeploy** a stack.
- Quer rodar local sem domínio? Troque o `expose` por `ports: ["3005:3005"]`, remova os labels do Traefik e abra `http://localhost:3005`.

---

## 7. Recepção local sem tokens

A tela de inatividade diferencia automaticamente:

- **passagem rápida:** saudação curta à Feira de Ciências;
- **pessoa próxima e parada:** convite para participar do Detetive IA.

Esse fluxo usa somente processamento de imagem e voz nativa no navegador. Portanto, não consome caracteres da ElevenLabs nem tokens de IA quando visitantes passam pelo totem.

Para aproximar a zona de convite de 1 metro, posicione a câmera apontada apenas para a frente do equipamento. A regulagem detalhada está em `ALTERACOES-RECEPCAO.md`.

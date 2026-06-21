# ── Detetive IA — imagem de produção (Next.js + Baileys) ──
# Browser com câmera/microfone roda na MÁQUINA do totem (localhost), não aqui.

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3005
ENV TZ=America/Sao_Paulo

# Apenas o necessário para rodar `next start`
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.js ./next.config.js

# Pasta persistente da sessão do WhatsApp (montada como volume)
RUN mkdir -p /app/.baileys_auth

EXPOSE 3005
CMD ["npm", "run", "start"]

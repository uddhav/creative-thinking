# Runs the MCP server over Streamable HTTP, for hosting it as a remote MCP
# server (for example a Claude custom connector). For local stdio use, run the
# package with npx instead; see README "Run over HTTP".

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
# --ignore-scripts skips husky's git hook install; there is no .git here.
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

FROM node:22-alpine AS release

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Sessions and plans persist to /data. Mount a volume there to keep them
# across restarts and deploys.
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]

ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    HOST=0.0.0.0 \
    PORT=8080 \
    PERSISTENCE_TYPE=filesystem \
    PERSISTENCE_PATH=/data \
    DISABLE_THOUGHT_LOGGING=true

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["node", "dist/mcp-server-main.js"]

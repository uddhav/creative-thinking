# Runs the MCP server over Streamable HTTP, for hosting it as a remote MCP
# server (for example a Claude custom connector). For local stdio use, run the
# package with npx instead; see README "Run over HTTP".

FROM node:22-alpine AS base
# The lockfile is written by npm 11. The npm 10 that ships with node:22 rejects
# it ("Missing: ... from lock file"), so `npm ci` failed and the image never
# built. CI installs npm 11 for the same reason.
RUN npm install -g npm@11 && npm cache clean --force

FROM base AS builder

WORKDIR /app

COPY package*.json ./
# --ignore-scripts skips husky's git hook install; there is no .git here.
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

FROM base AS release

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY scripts/docker/entrypoint.mjs ./entrypoint.mjs

# With the filesystem backend, sessions and plans persist under /data. Mount a
# volume at /data to keep them across restarts and deploys. The store sits one
# level down because the adapter refuses a top-level directory such as /data.
# For Postgres, set PERSISTENCE_TYPE=postgres and DATABASE_URL (pg ships in
# node_modules).
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]

ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    HOST=0.0.0.0 \
    PORT=8080 \
    PERSISTENCE_TYPE=filesystem \
    PERSISTENCE_PATH=/data/creative-thinking \
    PERSISTENCE_AUTO_SAVE=true \
    DISABLE_THOUGHT_LOGGING=true

# No `USER node` here: the entrypoint starts as root, fixes /data ownership,
# then drops to `node` before the server code loads (see entrypoint.mjs).
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["node", "entrypoint.mjs"]

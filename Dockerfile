# API server only (monorepo workspace build).
# Railway: set root to repo root, do NOT use "Docker image" deploy with name artifacts/api-server.

FROM node:24-alpine
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY lib ./lib
COPY scripts ./scripts
COPY artifacts ./artifacts

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "artifacts/api-server/dist/index.mjs"]

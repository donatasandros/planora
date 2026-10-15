ARG NODE_VERSION=24.15.0
FROM node:${NODE_VERSION}-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS prepare
WORKDIR /app
RUN pnpm add --global turbo@2.10.12
COPY . .
RUN turbo prune bot --docker

FROM base AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
	python3 make g++ libpq-dev \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=prepare /app/out/full/ .

RUN pnpm turbo build

FROM node:${NODE_VERSION}-bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app

RUN addgroup --system --gid 1001 planora-bot
RUN adduser --system --uid 1001 --gid 1001 planora-bot
USER planora-bot
COPY --from=builder /app .

CMD ["node", "apps/bot/dist/index.mjs"]

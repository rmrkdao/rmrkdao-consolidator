FROM node:14-alpine as deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update && apk add --no-cache libc6-compat vim htop screen git
WORKDIR /app
COPY package.json yarn.lock ./
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN yarn install --frozen-lockfile


# Rebuild the source code only when needed
FROM deps AS builder
WORKDIR /app
COPY . .


# Test application
FROM builder AS tester
WORKDIR /app
RUN yarn test:docker


# Optimize build for production
FROM tester AS optimizer
WORKDIR /app

# Transpile TypeScript to JavaScript
RUN yarn build
# Clean up node_modules in preparation for production
RUN yarn install --frozen-lockfile --production --ignore-scripts --offline


FROM node:14-alpine as app
# Handle kernel signals 
# @see https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#handling-kernel-signals
RUN apk add --no-cache tini 
WORKDIR /app

ENV NODE_ENV production

COPY --from=optimizer /app/build ./build
COPY --from=optimizer /app/prisma ./prisma
COPY --from=optimizer /app/node_modules ./node_modules
COPY --from=optimizer /app/package.json ./package.json

# EXPOSE 4001

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["/usr/local/bin/node", "build/proc/consolidate"]
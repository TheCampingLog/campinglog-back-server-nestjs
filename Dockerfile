# 1단계: 빌드
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# NODE_ENV 설정
ENV NODE_ENV=prod

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# 빌드 시 config/env/*.env가 dist/config/env/로 복사됨
RUN npm run build

# 2단계: production dependencies만 설치
FROM node:22-alpine AS deps
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# 3단계: 실행
FROM node:22-alpine AS runner
WORKDIR /usr/src/app

# NODE_ENV 설정
ENV NODE_ENV=prod

RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nestjs /usr/src/app/dist ./dist
COPY --from=deps --chown=nestjs:nestjs /usr/src/app/node_modules ./node_modules

USER nestjs

EXPOSE 8080

CMD ["node", "dist/main.js"]

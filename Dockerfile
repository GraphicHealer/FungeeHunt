FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/server/package*.json ./packages/server/
COPY packages/web/package*.json ./packages/web/

RUN npm install

COPY . .

RUN npx prisma generate --schema=packages/server/src/db/schema.prisma
RUN npm run build --workspace=@fungeehunt/web

ENV FRONTEND_BUILD_DIR=/app/packages/web/build

EXPOSE 3000

CMD ["npx", "tsx", "packages/server/src/index.ts"]

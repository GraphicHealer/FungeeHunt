FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl ffmpeg fonts-dejavu-core fontconfig && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/server/package*.json ./packages/server/
COPY packages/web/package*.json ./packages/web/

RUN npm install

COPY . .

ENV DATABASE_URL=postgresql://placeholder:placeholder@placeholder:5432/placeholder

RUN npx prisma generate --schema=packages/server/src/db/schema.prisma
RUN npm run build --workspace=@fungeehunt/web

ENV FRONTEND_BUILD_DIR=/app/packages/web/build

EXPOSE 3000

CMD ["sh", "-c", "npm run db:migrate && npx tsx packages/server/src/index.ts"]

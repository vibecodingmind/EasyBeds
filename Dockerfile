FROM node:20-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN npm install -g bun && bun install
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]

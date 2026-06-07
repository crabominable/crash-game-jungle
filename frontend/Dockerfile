FROM oven/bun:1.1.8-alpine AS builder

WORKDIR /app

# Copy the entire workspace to build properly
COPY package.json bun.lockb ./
COPY packages/contracts/package.json packages/contracts/
COPY frontend/package.json frontend/
COPY tsconfig.base.json ./

RUN bun install --frozen-lockfile

# Copy the source code
COPY packages/contracts packages/contracts/
COPY frontend frontend/

# Build the frontend
WORKDIR /app/frontend
RUN bun run build

# Production server
FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Replace default nginx config to handle SPA routing if necessary
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Etapa 1. Compila Angular
FROM node:20-alpine AS construccion
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx ng build --configuration production

# Etapa 2. nginx sirve la interfaz y redirige /api al backend
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=construccion /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80

# syntax = docker/dockerfile:1
ARG NODE_VERSION=22.21.1

# --- Build stage ---------------------------------------------------------
FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app
ENV NODE_ENV=production

# Install deps (incl. dev deps — Vite/TS are required to build)
COPY package.json package-lock.json* ./
RUN npm install --include=dev

# Vite build needs VITE_* vars at build time. Pass them via --build-arg
# (or `fly deploy --build-secret`-injected env). They are baked into
# the static bundle, so the API key here is a low-trust shared secret.
ARG VITE_CRM_API_URL
ARG VITE_PROVIDER_FORM_API_KEY
ENV VITE_CRM_API_URL=${VITE_CRM_API_URL}
ENV VITE_PROVIDER_FORM_API_KEY=${VITE_PROVIDER_FORM_API_KEY}

COPY . .
RUN npm run build

# --- Runtime stage -------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# SPA-friendly config: gzip, fallthrough to index.html, cache static assets.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

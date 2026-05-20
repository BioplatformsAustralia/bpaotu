# Stages:
# 1. React app
#    a. deps: Install dependencies and cache them (for both development and production)
#    b. dev: Run development server with hot reloading (for development)
#    c. build: Build production assets (for production)
# 2. nginx webserver
#    a. prod: Serve built assets with nginx (for production)


####
# 1: React app
####


# a. Base dependencies layer
FROM node:16-alpine AS deps
WORKDIR /frontend

# Copy dependency manifests ONLY (for cache) and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile



# b. Development (with hot reloading assets)
FROM node:16-alpine AS dev
WORKDIR /frontend

ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=3000
ENV CHOKIDAR_USEPOLLING=true

# Copy installed dependencies from deps stage (cached)
COPY --from=deps /frontend/node_modules ./node_modules

# Copy application source required for dev server
COPY src ./src
COPY public ./public
COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json

# Run development server with hot reloading
EXPOSE 3000
CMD ["yarn", "start"]


# c. Production (build app)
FROM node:16-alpine AS build
WORKDIR /frontend

# Prevent running lifecycle scripts during install (e.g. postinstall)
# No build scripts required at this stage - just install dependencies for production
ENV NODE_ENV=production

# Copy installed dependencies from deps stage (cached)
COPY --from=deps /frontend/node_modules ./node_modules

# Copy application source required for build
COPY src ./src
COPY public ./public
COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json

# Build production assets using previously installed dependencies
RUN yarn build


####
# 2: nginx
####

# a. Production (serve built assets with nginx)
FROM nginx:1.26-alpine AS prod

# Remove default config
RUN rm -f /etc/nginx/conf.d/default.conf

# Create /tmp where nginx pid and cache can be stored with correct permissions for non-root user
# Set permissions for non-root user (nginx) to write to necesary directories
RUN mkdir -p /tmp /var/cache/nginx \
    && chown -R nginx:nginx /tmp /var/cache/nginx /usr/share/nginx/html /var/run \
    && chmod -R 700 /var/cache/nginx

# Pre-create nginx cache directories with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 700 /var/cache/nginx

# Copy build output
COPY --from=build /frontend/build /usr/share/nginx/html

# Allow choosing Nginx config at build time: "real" (default) or "local"
ARG FRONTEND_NGINX=real

# Copy nginx configs (both variants) and select one based on build arg
RUN mkdir -p /etc/nginx/snippets /etc/nginx/conf.d
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/amotu-prod-real.conf /tmp/amotu-prod-real.conf
COPY nginx/amotu-prod-local.conf /tmp/amotu-prod-local.conf
COPY nginx/amotu.locations.conf /etc/nginx/snippets/amotu.locations.conf

# Choose the appropriate amotu.conf based on `FRONTEND_NGINX` argument
RUN if [ "$FRONTEND_NGINX" = "local" ]; then \
            cp /tmp/amotu-prod-local.conf /etc/nginx/conf.d/amotu.conf; \
        else \
            cp /tmp/amotu-prod-real.conf /etc/nginx/conf.d/amotu.conf; \
        fi && rm -f /tmp/amotu-prod-*.conf

# Use non-root user
USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

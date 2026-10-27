# WealthDesk web Dockerfile — multi-stage: Node build → nginx serve.
#
# WHY TWO STAGES: the build stage needs the whole workspace (Nx graph,
# libs, tsconfig paths) and dev dependencies; the runtime stage ships
# only the static SPA bundle + nginx. The final image has no Node, no
# source, no node_modules — smaller and safer.
#
# NOTE: image builds were NOT run in the dev VM (no Docker there).
# Build with: docker build -f apps/web/Dockerfile -t wealthdesk-web .

# ---- Build stage: compile the Angular app (webpack builder) ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# --legacy-peer-deps matches the local install quirk (the @nx/webpack
# addition needed it); plain `npm ci` may fail on peer resolution.
RUN npm ci --legacy-peer-deps
COPY . .
RUN NX_DAEMON=false npx nx build web

# ---- Runtime stage: nginx serves the static bundle ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist/apps/web/browser /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

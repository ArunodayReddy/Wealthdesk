# WealthDesk api Dockerfile — multi-stage: Node build+prune → slim runtime.
#
# WHY TWO STAGES: the build stage needs the whole workspace and dev
# dependencies to run the Nx webpack build and prune the production
# dependency list. The runtime stage ships only the webpack bundle
# (dist/api/main.js) plus the pruned production install (express only).
#
# NOTE: image builds were NOT run in the dev VM (no Docker there).
# Build with: docker build -f api/Dockerfile -t wealthdesk-api .
# The api runs on port 3333 (see api/src/main.ts).

# ---- Build stage: webpack bundle + pruned prod dependency list ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN NX_DAEMON=false npx nx run api:prune

# ---- Runtime stage: bundle + production deps only ----
FROM node:24-alpine AS runtime
WORKDIR /app
# dist/api contains main.js (+ map), the pruned package.json /
# package-lock.json, and workspace_modules/ (empty: webpack already
# bundled domain + util into main.js).
COPY --from=build /app/dist/api ./
RUN npm ci --omit=dev
EXPOSE 3333
CMD ["node", "main.js"]

# Executor temporário: não contém nem inicia dockerd.
FROM docker:28.5.1-cli AS docker-cli
FROM node:22-alpine
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker-cli /usr/local/libexec/docker/cli-plugins/docker-compose /usr/local/libexec/docker/cli-plugins/docker-compose
WORKDIR /opt/foundation
COPY executor/package.json executor/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && docker --version && docker compose version
COPY executor/entrypoint.mjs ./entrypoint.mjs
ENV FOUNDATION_RUNTIME_PACKAGE=/opt/foundation/package.json
ENTRYPOINT ["node", "/opt/foundation/entrypoint.mjs"]

FROM node:22-bookworm-slim AS node22
FROM mcr.microsoft.com/playwright:v1.65.1-noble
# Keep the same Node 22 contract as dev/build; browser image supplies Ubuntu dependencies.
COPY --from=node22 /usr/local/ /usr/local/
WORKDIR /app
CMD ["sh", "-c", "npm ci --include=dev && npm run check && npm run test:e2e"]

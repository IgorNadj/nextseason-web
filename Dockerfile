FROM node:23-alpine3.20

COPY . .

ENTRYPOINT ["npx", "http-server", "."]



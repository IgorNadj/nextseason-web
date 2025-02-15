FROM node:23-alpine3.20

COPY . .

RUN npx http-server .



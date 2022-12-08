FROM node:18-alpine as main
WORKDIR /app
COPY . .
RUN yarn install --production=false && yarn run build

FROM node:18-alpine
WORKDIR /app
COPY --from=main /app/dist /app/dist/
COPY package*.json ./dist/
RUN cd dist && yarn install --production

EXPOSE 3000

ENTRYPOINT [ "node", "/app/dist/main.js" ]

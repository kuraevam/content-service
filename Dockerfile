FROM node:18-alpine as main
WORKDIR /app
COPY . .
RUN yarn install --production=false && yarn run build

FROM node:18-alpine
WORKDIR /app
RUN yarn global add pm2
COPY --from=main /app/dist /app/
COPY package*.json ./
RUN yarn install --production

EXPOSE 3000

ENTRYPOINT [ "pm2-runtime", "/app/main.js", "-i", "27" ]

# Builder
FROM node:18.15.0-alpine as BUILDER

RUN apk update && apk add bash
RUN apk add python3
RUN mkdir -p /home/node/app/node_modules
RUN chown -R node:node /home/node/app

USER node

WORKDIR /home/node/app

COPY src src
COPY prisma prisma
COPY package.json yarn.lock tsconfig.json tsconfig.build.json nest-cli.json ./

RUN yarn install --frozen-lockfile --ignore-scripts
RUN yarn prisma generate
RUN yarn run build

# Application
FROM node:18.15.0-alpine

RUN apk update && apk add bash
RUN apk add python3
RUN mkdir -p /home/node/app/node_modules
RUN chown -R node:node /home/node/app

USER node

WORKDIR /home/node/app

COPY --from=BUILDER /home/node/app/dist ./dist
COPY --from=BUILDER /home/node/app/prisma ./prisma
COPY --from=BUILDER /home/node/app/package.json /home/node/app/yarn.lock ./
COPY --from=BUILDER /home/node/app/node_modules/.prisma ./node_modules/.prisma

RUN yarn install --ignore-scripts --frozen-lockfile --production

EXPOSE 3333

CMD ["yarn", "run", "start:prod"]

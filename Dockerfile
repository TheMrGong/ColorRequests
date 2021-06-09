FROM node:15-alpine

# https://stackoverflow.com/questions/57088230/node-canvas-on-alpine-within-docker

# add libraries; sudo so non-root user added downstream can get sudo
RUN apk add --no-cache \
    sudo \
    curl \
    build-base \
    g++ \
    libpng \
    libpng-dev \
    jpeg-dev \
    pango-dev \
    cairo-dev \
    giflib-dev \
    python \
    ;

# add glibc
RUN apk --no-cache add ca-certificates wget  && \
    wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub && \
    wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.29-r0/glibc-2.29-r0.apk && \
    apk add glibc-2.29-r0.apk \
    ;

# add ffmpeg and bash
RUN apk add --no-cache ffmpeg bash

WORKDIR /usr/src/app

RUN npm install -g pnpm
RUN pnpm install -g pnpm

COPY ./package.json /usr/src/app
COPY ./yarn.lock /usr/src/app

RUN pnpm install
COPY . /usr/src/app

CMD ["yarn", "start"]
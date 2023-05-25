FROM node:16-alpine

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
    ;
# https://stackoverflow.com/questions/62554991/how-do-i-install-python-on-alpine-linux
# Install python/pip
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools

# add ffmpeg and bash
RUN apk add --no-cache ffmpeg bash

WORKDIR /usr/src/app

COPY ./package.json /usr/src/app
COPY ./pnpm-lock.yaml /usr/src/app

RUN npm install
COPY . /usr/src/app

CMD ["npm", "start"]
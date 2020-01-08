FROM ampervue/ffmpeg
FROM node:10.9.0

COPY --from=0 / /

WORKDIR /usr/src/app

COPY ./package.json /usr/src/app
COPY ./yarn.lock /usr/src/app

RUN yarn install
COPY . /usr/src/app

CMD ["yarn", "start"]
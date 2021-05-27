# Container image that runs your code
FROM node:12-alpine AS build-stage
# RUN apk add --no-cache python g++ make

COPY src src
COPY webextension-polyfill webextension-polyfill
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json
COPY webpack.config.js webpack.config.js

#RUN cd /
## Copies your code file from your action repository to the filesystem path `/` of the container
#COPY src src
#COPY webextension-polyfill webextension-polyfill
#COPY package.json package.json
#COPY package-lock.json package-lock.json
#COPY tsconfig.json tsconfig.json
#COPY webpack.config.js webpack.config.js
#COPY webpack.config.js webpack.config.copy.js
#COPY .gitmodules .gitmodules

RUN npm i
# Code file to execute when the docker container starts up (`entrypoint.sh`)
RUN npm run build
RUN rm -rf node_modules
#
#FROM scratch AS export-stage
#COPY --from=build-stage /dist /
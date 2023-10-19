FROM node:18.0.0-alpine
RUN apk add curl jq gnupg nodejs npm
WORKDIR /usr/server
COPY . .
RUN npm ci --quiet
CMD npm run start

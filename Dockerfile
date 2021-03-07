FROM node:14 as prod
WORKDIR /app
COPY . .
RUN yarn install
EXPOSE 80

FROM prod as dev
RUN yarn global add nodemon
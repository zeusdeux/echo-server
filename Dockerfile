FROM node:carbon

ARG nodeEnv
ENV NODE_ENV ${nodeEnv:-development}

ARG appPort
ENV PORT ${appPort:-8484}

EXPOSE $PORT

WORKDIR /echo-websocket-server

COPY . /echo-websocket-server

RUN npm install

RUN echo $NODE_ENV $PORT

ENTRYPOINT npm start

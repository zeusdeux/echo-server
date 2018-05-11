FROM node:carbon

ARG nodeEnv
ENV NODE_ENV ${nodeEnv:-development}

ENV DEBUG "echo:*"

# internal websocket server port
EXPOSE 8484
# internal http server port
EXPOSE 8585

WORKDIR /echo-websocket-server

COPY . /echo-websocket-server

RUN npm install

RUN echo $NODE_ENV $DEBUG

ENTRYPOINT ["npm", "start"]

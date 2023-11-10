FROM node:18.17
WORKDIR /app

ARG VITE_SERVER_URL="http://localhost:5001"
ENV VITE_SERVER_URL $VITE_SERVER_URL
RUN echo "VITE_SERVER_URL=$VITE_SERVER_URL"

COPY package.json yarn.lock ./
COPY client/package.json ./client/
COPY common/package.json ./common/
COPY server/package.json ./server/

RUN yarn install

COPY . .

RUN yarn workspace common build

RUN yarn workspace client build

ARG OWL_SERVER_EXPRESS_APP_PORT=5000
ENV OWL_SERVER_EXPRESS_APP_PORT $OWL_SERVER_EXPRESS_APP_PORT

ARG OWL_SERVER_EXPRESS_APP_HOSTNAME=0.0.0.0
ENV OWL_SERVER_EXPRESS_APP_HOSTNAME $OWL_SERVER_EXPRESS_APP_HOSTNAME

EXPOSE 3000
ENTRYPOINT [ "yarn" ]
CMD ["workspace", "server", "start"]

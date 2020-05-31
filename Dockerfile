FROM node
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
COPY /appdata/server.json /app
COPY /appdata/ledger /app
CMD ["npm", "start"]

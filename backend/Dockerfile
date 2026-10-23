# FROM node:22-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# EXPOSE 9012
# CMD ["npm", "start"]
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
ENV npm_config_sharp_binary_host=https://npmmirror.com/mirrors/sharp
RUN npm install
COPY . .
EXPOSE 9012
CMD ["npm", "start"]
# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# CRA inlines REACT_APP_* env vars at build time. Pass the API base URL as a
# build arg (from docker-compose build.args / root .env) so the production
# bundle knows where the backend is. Without this it falls back to localhost.
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
# https://patrickdesjardins.com/blog/docker-nodejs-frontend-backend
# ---------------------------------------
# Development stage
# ---------------------------------------

# Use Node 18 alpine as parent image
FROM node:18-alpine AS development

# Change the working directory on the Docker image to /app
WORKDIR /node

# Copy package.json and package-lock.json to the /app directory
COPY package*.json ./

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# Install dependencies
RUN npm install

WORKDIR /node/app

# Start the application
CMD [ "npm", "run", "dev" ]

# ---------------------------------------
# Production stage
# ---------------------------------------
FROM nginx:1.25.0 AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN apt-get update && apt-get install -y \
    software-properties-common \
    npm
RUN npm install npm@latest -g && \
    npm install n -g && \
    n 18

WORKDIR /node
COPY package*.json ./
RUN npm install --include=dev

COPY . .
RUN npm run build

RUN rm -rf /usr/share/nginx/html/*
RUN mv dist/* /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]
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
CMD ["npm", "run", "start:development"]

# ---------------------------------------
# Production stage
# ---------------------------------------
FROM node:18-alpine AS production

WORKDIR /node

COPY package*.json ./

# Default build argument is dev
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

RUN npm install

COPY . .
#RUN npm run build

CMD ["npm", "run", "start"]
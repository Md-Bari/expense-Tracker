FROM node:20-alpine

WORKDIR /app

# Install dependencies needed for node-gyp or git if necessary
RUN apk add --no-cache libc6-compat git python3 make g++

COPY package*.json ./

# We'll install dependencies. If package.json doesn't exist yet, this will be skipped during bootstrap
RUN if [ -f package.json ]; then npm install; fi

COPY . .

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "run", "dev"]

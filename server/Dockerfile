FROM node:20-bullseye

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start:dev"]

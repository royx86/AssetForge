FROM node:22-bookworm-slim AS frontend-build

WORKDIR /usr/src/app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:22-bookworm-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Bundle backend source and the built frontend
COPY src ./src
COPY --from=frontend-build /usr/src/app/frontend/dist ./frontend/dist
COPY uploads/.gitkeep ./uploads/.gitkeep

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose server port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Start command
CMD ["npm", "start"]

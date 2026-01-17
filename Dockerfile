# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
RUN echo "⬇️ DEBUG: Listing dist contents"
RUN ls -R dist
RUN echo "⬆️ DEBUG: End Listing"

# Production stage
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
RUN echo "⬇️ DEBUG: Final Image Dist"
RUN ls -R dist

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Environment variables should be passed at runtime
# ENV MONGO_URI=...
# ENV BAMBOOHR_API_KEY=...

CMD ["npm", "run", "start:production"]

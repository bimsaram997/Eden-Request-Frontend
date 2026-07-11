# Stage 1: Build the Angular Application
FROM node:18-alpine AS build
WORKDIR /app

# Accept environment configuration profile as an argument (defaults to production)
ARG APP_ENV=production

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy code and build using the specific target profile
COPY . .
RUN npm run build -- --configuration=$APP_ENV

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled browser assets from the build stage
COPY --from=build /app/dist/eden-request-frontend/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
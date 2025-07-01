FROM node:22-alpine AS build
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
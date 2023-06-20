########################################
FROM node:18.13-alpine as builder

# Create the project directory inside the container.
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY packages/admin-ui/package*.json ./

# If you are building your code for production
#RUN npm ci --only=production
RUN npm install

########################################
# Copy code and build
# NOTE: source files are in reference to the monorepo root

COPY packages/admin-ui/.browserslistrc ./
COPY packages/admin-ui/tsconfig.json ./
COPY packages/admin-ui/tsconfig.app.json ./
COPY packages/admin-ui/proxy.conf.json ./
COPY packages/admin-ui/angular.json ./
COPY packages/admin-ui/src ./src

# build
RUN npm run build

########################################
FROM nginx:latest

COPY packages/admin-ui/nginx.default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/vNextAdminUiApp /usr/share/nginx/html

RUN ls -la /usr/share/nginx/html

EXPOSE 4200

CMD ["/bin/sh", "-c", "exec nginx -g 'daemon off;';"]

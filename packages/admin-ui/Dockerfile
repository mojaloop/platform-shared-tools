########################################
FROM node:18.13-alpine as builder

# Create the project directory inside the container.
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# If you are building your code for production
#RUN npm ci --only=production
RUN npm install

########################################
# Copy code and build
#
COPY .browserslistrc ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY proxy.conf.json ./
COPY angular.json ./
COPY src ./src

# build
RUN npm run build

########################################
FROM nginx:latest

COPY nginx.default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/vNextAdminUiApp /usr/share/nginx/html

RUN ls -la /usr/share/nginx/html

EXPOSE 4200

CMD ["/bin/sh", "-c", "exec nginx -g 'daemon off;';"]

FROM nginx:alpine

# Copy static frontend assets into standard Nginx html folder
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# echo-server

An echo http and ws server using nginx for SSL termination in prod deployed using docker.

## Motivation

I made this project only to play with docker and deploying a docker service behind nginx and using nginx for ssl termination.

## What does it do?

This service runs in a docker container which uses node carbon LTS.
It exposes an http server on port 8585.
This server echoes back all http requests.
It also handles http UPGRADE requests to support websockets.
The websocket server (which uses the same http server as before) also echoes back whatever that is sent to it.

The image is published as a public image to the docker hub as zeusdeux/echo-server.

## Docker prod run cmd

`PORT=9000 docker run -d -t --rm -p ${PORT}:8585 zeusdeux/echo-server`

The `-d` will detach the container, run it in the background and print the container id.
This can be checked again using `docker ps`.

The `-t` allocates a pseudo-TTY. This is so that when we run `docker attach <container id>` and then `ctrl-c` out of it, we only
exit the allocated TTY and don't kill the running container (which will happen by default if you don't pass this option).

The `--rm` automatically removes the container when it exits so that we don't rack up tons of non-running containers as they use
disk space and my ec2 instance is tiny af.

The `-p` option exposes an internal port to a host port. For e.g., `-p 9000:8585` will expose port `8585` from the docker container
as port `9000` in the host os. Therefore, if you have an http server running inside your docker container on port `8585` then to
access it on the host machine, you'd have to navigate to `localhost:9000`. Without this option, no internal ports are mapped to
any host os ports. So, yeah, this is an important one. You can also use `-P` but that has different semantics.

The `${PORT}` part is just a bash-ism to use the `$PORT` env var.

## nginx config

I use nginx as my reverse proxy and for SSL termination for this project.
I use [letsencrypt](https://letsencrypt.org/) for SSL certs.

Stick this config in `/etc/nginx/sites-available` and symlink it to `/etc/nginx/sites-enabled` as one would.

If you want to use it in nginx.conf directly, wrap it inside a `http {}` block.

```nginx
upstream echoServer {
    # port exposed from the running docker container
    server 127.0.0.1:9000;
}

server {
    listen 80;
    # setup dns entries for these subdomains with your provider
    server_name your.domain.com www.your.domain.com;

    # for letsencrypt verification
    location /.well-known/ {
       root <any folder really. keep in mind though to pass this as the value to -w option of certbot>;
    }

    location / {
       # redirect to https
       return 301 https://your.domain.com;
    }
}

server {
    listen 443;
    server_name your.domain.com www.your.domain.com;

    # certs generated by letsencrypt's certbot
    ssl_certificate /etc/letsencrypt/live/your.domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your.domain.com/privkey.pem;
    ssl on;

    # magic
    ssl_session_timeout 10m;
    ssl_session_cache builtin:1000 shared:SSL:10m;
    ssl_protocols  TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!eNULL:!EXPORT:!CAMELLIA:!DES:!MD5:!PSK:!RC4;
    ssl_prefer_server_ciphers on;

    # enable gzipping for all browsers and IE6+
    # only for assets. not for websocket traffic though.
    gzip on;
    gzip_proxied any;
    gzip_types text/plain text/xml text/css application/x-javascript;
    gzip_vary on;
    gzip_disable "MSIE [1-6]\.(?!.*SV1)";

    location / {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header X-NginX-Proxy true;
        proxy_http_version 1.1;
        proxy_pass http://echoServer;
        proxy_redirect off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 9999;
    }
}
```

## Some helpful docker commands

- `docker ps` - view list of running containers
- `docker system prune` - clean up dangling images and containers
- `docker attach <container id>` - attach to a running container. Be aware that ctrl-c from here might kill your container too depending on the options you ran the cotainer with
- `docker exec -it <container id> /bin/sh` - open up a terminal into the running container (not sure if this is the recommended way to do this though)
- `docker kill <container id>` - kill the running container

## Some helpful nginx commands

- `nginx -t` - test nginx config. This is very _very_ useful
- `nginx -s stop` - stop nginx. Though, I would recommend using your service manager for this. For e.g., `sudo service nginx restart/stop/start` on Ubuntu

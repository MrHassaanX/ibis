# Wings keeps an image's entrypoint. The official Node image otherwise starts a REPL.
FROM node:24.22.2-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c
WORKDIR /home/container
ENTRYPOINT ["/usr/local/bin/node", "/home/container/index.js"]
CMD []

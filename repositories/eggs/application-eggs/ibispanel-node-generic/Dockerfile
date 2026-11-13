# Fixed entrypoint; Egg variables are read as data, never expanded into a shell command.
FROM node:24.22.2-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c
RUN apt-get update -qq \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends git ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*
COPY launcher.sh /usr/local/bin/ibis-node-launcher
RUN chmod 0755 /usr/local/bin/ibis-node-launcher
WORKDIR /home/container
ENTRYPOINT ["/usr/bin/tini", "-g", "--", "/usr/local/bin/ibis-node-launcher"]

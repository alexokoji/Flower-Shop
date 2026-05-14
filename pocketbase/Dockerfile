# Alpine + the PocketBase Linux binary. Tiny image (~30 MB).
FROM alpine:3.20

ARG PB_VERSION=0.38.0
ARG TARGETARCH=amd64

RUN apk add --no-cache ca-certificates tzdata unzip wget && \
    update-ca-certificates

WORKDIR /pb

# Fetch the matching PocketBase release for the target architecture.
RUN wget --quiet \
      "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" \
      -O /tmp/pb.zip && \
    unzip /tmp/pb.zip -d /pb && \
    rm /tmp/pb.zip && \
    chmod +x /pb/pocketbase

# App schema (auto-applied on first run) + custom routes (checkout, webhooks)
COPY pb_migrations /pb/pb_migrations
COPY pb_hooks      /pb/pb_hooks

# Fly will mount the persistent volume here. Migrations + hooks live in
# the image, but the SQLite DB and uploaded files persist on the volume.
VOLUME ["/pb/pb_data"]

EXPOSE 8090

# 0.0.0.0 so Fly's proxy can reach the process from outside the container.
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", \
     "--dir=/pb/pb_data", \
     "--migrationsDir=/pb/pb_migrations", \
     "--hooksDir=/pb/pb_hooks"]
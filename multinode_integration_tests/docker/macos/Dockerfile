FROM rust:bullseye

ARG uid
ARG gid

RUN (addgroup pulsecloak --gid $gid || continue) \
    && adduser --disabled-password --uid $uid --gid $gid --home /home/pulsecloak pulsecloak \
    && chown -R $uid:$gid /home/pulsecloak

RUN apt-get update && apt-get install -y sudo curl && rustup component add rustfmt clippy \
    && cargo install sccache && chown -R $uid:$gid /usr/local/cargo /usr/local/rustup

USER pulsecloak

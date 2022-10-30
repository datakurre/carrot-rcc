# Download Debian ca-certificates
FROM debian:stable-slim AS ca-certificates
RUN apt-get update
RUN apt-get install -y --no-install-recommends ca-certificates
RUN update-ca-certificates

# Build carrot-rcc image from PyPI release
FROM debian:stable-slim
COPY --from=ca-certificates /etc/ssl /etc/ssl
ARG RCC_VERSION=v11.26.3
ARG TINI_VERSION=v0.19.0
ADD https://downloads.robocorp.com/rcc/releases/${RCC_VERSION}/linux64/rcc /bin/rcc
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /bin/tini
ADD https://raw.githubusercontent.com/datakurre/carrot-rcc/main/conda.yaml /conda.yaml
RUN mkdir -p /robots \
 && echo "#!/bin/sh" > /bin/entrypoint.sh \
 && chmod u+x /bin/tini /bin/rcc /bin/entrypoint.sh \
 && rcc configuration identity --do-not-track \
 && rcc holotree variables conda.yaml >> /bin/entrypoint.sh \
 && sed -i "s|export CONDA_PROMPT|# export CONDA_PROMPT|g" /bin/entrypoint.sh \
 && echo 'exec tini -- carrot-rcc $(find /robots -name "*.zip") $1 $2 $3 $4 $5 $6 $7 $8 $9' >> /bin/entrypoint.sh
ENTRYPOINT ["/bin/entrypoint.sh"]

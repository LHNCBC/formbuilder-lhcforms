## Instructions on how to run Form Builder for LHC-Forms in Docker container.

This document assumes the reader is familiar with how to use Docker and
its basic commands. To learn more about Docker, go to
https://docs.docker.com.

First build your image. 

For example, you may use the following command from your formbuilder project directory:
`docker build -t lhc/formbuilder:latest .`

#### Run with HTTPS protocol.

By default Form Builder uses HTTPS protocol and binds to 9443 port. When
using HTTPS, The server looks for `ca.crt`, `server.crt` and `server.key`
files in `/opt/ssl` directory. To provide these files from the host file
system, you can map host directory to container using `-v` option of
Docker run command.

To change the port, use `-e PORT={port number}` option and map it to
host port with `-p` option.

The following example maps `~/ssl` on the host file system to `/opt/ssl`
on the container file system, and maps host port `7443` to `9443` on the
container.

`docker run --name fb -d -p 7443:9443 -v ~/ssl:/opt/ssl lhc/formbuilder`

#### Run with HTTP protocol.

To use the HTTP protocol, set the `USE_HTTP` environment variable. With
this option, there is no need to mount any local file system.

The following example uses the HTTP protocol, binds to `9080` port in the
container, and maps it to `7080` port on the host.

`docker run --name fb -d -p 7080:9080 -e PORT=9080 -e USE_HTTP=true lhc/formbuilder`


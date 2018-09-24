FROM node:carbon

# Create app directory
ENV appDir /opt/formbuilder
ENV webAccount webserv
RUN useradd -Ur ${webAccount} && \
    mkdir -p ${appDir}
WORKDIR ${appDir}

# Bundle app source
COPY dist/ ${appDir}/
RUN chown -R ${webAccount}:${webAccount} ${appDir}
RUN chmod u+x ./fbpm2

EXPOSE 9443
CMD  ./fbpm2 start --no-daemon ./server/formbuilder.pm2.json

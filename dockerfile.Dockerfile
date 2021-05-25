# Container image that runs your code
FROM node:12-alpine
# RUN apk add --no-cache python g++ make

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY entrypoint.sh /entrypoint.sh
COPY index.js /index.js

# Code file to execute when the docker container starts up (`entrypoint.sh`)
# ENTRYPOINT ["node ./index.js"]

CMD ["npm",  "-v"]
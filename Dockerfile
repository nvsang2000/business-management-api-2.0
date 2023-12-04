# Dockerfile
FROM node:18-buster

# env
ENV NODE_ENV = 'development'
ENV URL_FIND_OPEN = 'https://find-open.com'
ENV URL_BASE_GOOGLE = 'https://www.google.com/?hl=en-US'
ENV GOOGLE_EMAIL = 'johhnysang267@gmail.com'
ENV GOOGLE_PASSWORD = 'sang2607200209'
ENV GOOGLE_MAP_API_KEY = 'AIzaSyANZf_3Y_6YFizSpYe3v_XegrSNcWfxhoI'
ENV JWT_SECRET = '7oxynxujKs7b1DYwClPyR1ExggfEzOP'
ENV DATABASE_URL = 'postgres://nvsang2000:pKV4QgmclO1r@ep-dawn-wildflower-022942.ap-southeast-1.aws.neon.tech/neondb'

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# COPY
COPY . .

# Creates a "dist" folder with the production build
RUN npm run build
RUN npm run postinstall

# define port
EXPOSE 80/tcp

# Start the server using the production build
CMD [ "node", "dist/src/main" ]

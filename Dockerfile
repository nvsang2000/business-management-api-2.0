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

# Install Google Chrome
RUN apt-get update && apt-get install -y --no-install-recommends \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libuuid1 \
    libx11-6 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxkbcommon0 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \
    libxss1 \
    libxtst6 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

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

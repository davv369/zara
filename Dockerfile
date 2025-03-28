FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Uruchom aplikację
CMD ["node", "dist/main.js"]

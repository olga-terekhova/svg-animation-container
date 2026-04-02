FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Create unprivileged user before copying files
RUN addgroup -S nodejs && adduser -S nodeapp -G nodejs

COPY --chown=nodeapp:nodejs package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=nodeapp:nodejs server.js ./
COPY --chown=nodeapp:nodejs public ./public

USER nodeapp

EXPOSE 3000

CMD ["node", "server.js"]
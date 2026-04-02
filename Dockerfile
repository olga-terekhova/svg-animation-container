FROM node:22-slim

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/app/browsers

WORKDIR /app

# Create unprivileged user (Debian syntax)
RUN groupadd -r nodejs && useradd -r -g nodejs -d /app nodeapp

# Node dependencies — playwright must be a production dep in package.json
COPY --chown=nodeapp:nodejs package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Install chromium headless shell binary (no full Chromium UI)
RUN npx playwright install chromium --only-shell

# Install chromium system deps + ffmpeg in one apt pass, then clean
RUN npx playwright install-deps chromium && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Give nodeapp read/execute access to the browser binaries
RUN chown -R nodeapp:nodejs /app/browsers

# Application files
COPY --chown=nodeapp:nodejs server.js capture.js ./
COPY --chown=nodeapp:nodejs public ./public

USER nodeapp

EXPOSE 3000

CMD ["node", "server.js"]
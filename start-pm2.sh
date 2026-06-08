#!/bin/bash

# Load environment variables from .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Create logs directories
mkdir -p apps/api/logs
mkdir -p apps/web/logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

echo "✅ TMS Platform started with PM2"
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs"

# PM2 Deployment Guide

## Setup

1. **Build the project first:**

   ```bash
   pnpm build
   ```

2. **Ensure PM2 is installed globally:**

   ```bash
   npm install -g pm2
   ```

3. **Create log directories:**
   ```bash
   mkdir -p apps/api/logs
   mkdir -p apps/web/logs
   ```

## Start with PM2

```bash
# Using npm script
pnpm pm2:start

# Or directly
pm2 start ecosystem.config.js
```

## PM2 Commands

```bash
# Check status
pnpm pm2:status

# View logs
pnpm pm2:logs

# Restart apps
pnpm pm2:restart

# Stop apps
pnpm pm2:stop

# Delete from PM2
pnpm pm2:delete
```

## Environment Variables

Environment variables are loaded from `.env` file via `dotenv` in `ecosystem.config.js`.

## Important Notes

1. **Always build before starting with PM2**
2. **Apps run on:** API port 4001, Frontend port 3003
3. **Update env:** Restart PM2 after changing `.env`

## Troubleshooting

Check logs: `pm2 logs` or `tail -f apps/*/logs/*.log`

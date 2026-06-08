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
# or: pm2 status

# View logs
pnpm pm2:logs
# or: pm2 logs

# View specific app logs
pm2 logs tms-api
pm2 logs tms-web

# Restart apps
pnpm pm2:restart
# or: pm2 restart ecosystem.config.js

# Stop apps
pnpm pm2:stop
# or: pm2 stop ecosystem.config.js

# Delete from PM2
pnpm pm2:delete
# or: pm2 delete ecosystem.config.js

# Monitor
pm2 monit
```

## Auto-start on System Reboot

```bash
# Save current PM2 process list
pm2 save

# Generate startup script
pm2 startup

# Follow the instructions output by the command above
```

## Environment Variables

Environment variables are loaded from `.env` file at the root of the project.

The `ecosystem.config.js` uses `dotenv` to load these variables before PM2 starts the apps.

## Important Notes

1. **Always build before starting with PM2:**

   ```bash
   pnpm build
   pnpm pm2:start
   ```

2. **The apps will run on:**
   - API: `http://localhost:4001` (or `PORT` from .env)
   - Frontend: `http://localhost:3003` (or `FRONTEND_PORT` from .env)

3. **If you update `.env`, restart PM2:**

   ```bash
   pnpm pm2:restart
   ```

4. **Check logs if something goes wrong:**

   ```bash
   # All logs
   pnpm pm2:logs

   # API logs only
   pm2 logs tms-api

   # Or check log files directly
   tail -f apps/api/logs/api-error.log
   tail -f apps/web/logs/web-error.log
   ```

## Troubleshooting

### API won't start

1. Check if port 4001 is already in use: `lsof -i :4001`
2. Check database connection in `.env`
3. Check API logs: `pm2 logs tms-api`

### Frontend won't start

1. Check if port 3003 is already in use: `lsof -i :3003`
2. Ensure `.next` build folder exists in `apps/web`
3. Check web logs: `pm2 logs tms-web`

### Environment variables not loading

1. Ensure `.env` file exists at project root
2. Verify `dotenv` package is installed: `pnpm list dotenv`
3. Check `ecosystem.config.js` has correct env mappings

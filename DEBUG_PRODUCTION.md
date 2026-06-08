# Debug Production: ERR_CONNECTION_REFUSED

## 1. Kiểm tra API có đang chạy không

```bash
# Check PM2 status
pm2 status

# Check if API process is running
pm2 logs tms-api --lines 50

# Check if port 4001 is listening
lsof -i :4001
# or
netstat -tlnp | grep 4001
```

## 2. Kiểm tra API có khởi động thành công không

```bash
# View API logs
pm2 logs tms-api

# Check for errors
pm2 logs tms-api --err

# If API crashed, check why
cat apps/api/logs/api-error.log
```

## 3. Test API trực tiếp từ server

```bash
# Test health check
curl http://localhost:4001/api/v1/auth/me

# Test login endpoint
curl -X POST http://localhost:4001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## 4. Kiểm tra Environment Variables

```bash
# Check .env exists
ls -la .env

# Check DATABASE_URL
cat .env | grep DATABASE_URL

# Check PORT
cat .env | grep PORT

# Check if PM2 loaded env correctly
pm2 describe tms-api | grep -A 20 env
```

## 5. Kiểm tra Next.js có đúng API URL không

```bash
# Check web app env
pm2 describe tms-web | grep -A 20 env

# Check .env
cat .env | grep API_BASE_URL
cat .env | grep NEXT_PUBLIC_API_URL
```

## 6. Common Issues & Fixes

### Issue: API not starting

```bash
# Rebuild API
cd apps/api
pnpm build

# Restart
pm2 restart tms-api
```

### Issue: Wrong API URL in Frontend

Edit `.env`:

```bash
# If API is on same server
API_BASE_URL=http://localhost:4001/api/v1
NEXT_PUBLIC_API_URL=http://localhost:4001/api/v1

# If API is on different domain/IP
API_BASE_URL=http://YOUR_API_DOMAIN:4001/api/v1
NEXT_PUBLIC_API_URL=http://YOUR_API_DOMAIN:4001/api/v1
```

Then rebuild web:

```bash
cd apps/web
pnpm build
pm2 restart tms-web
```

### Issue: Database connection failed

```bash
# Test database connection
psql "postgresql://tms:123456@103.75.183.235:5432/tms" -c "SELECT 1"

# Or check API logs for Prisma errors
pm2 logs tms-api | grep -i "prisma\|database"
```

### Issue: CORS error

Edit `.env` and add your frontend domain:

```bash
CORS_ORIGINS=http://localhost:3003,http://YOUR_FRONTEND_DOMAIN
```

Then restart API:

```bash
pm2 restart tms-api
```

## 7. Full Restart Procedure

```bash
# Stop all
pm2 stop all

# Clean logs
pm2 flush

# Ensure build is fresh
pnpm build

# Start again
pm2 start ecosystem.config.js

# Monitor
pm2 monit
```

## 8. Check from Browser Console

Open browser DevTools → Network tab:

- What is the exact request URL being called?
- Is it trying to connect to the right host/port?
- Check Response tab for error details

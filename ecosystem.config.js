const fs = require("fs");
const path = require("path");

// Load .env manually without dotenv dependency
const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  });
}

module.exports = {
  apps: [
    {
      name: "tms-api",
      cwd: "./apps/api",
      script: "dist/main.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: process.env.NODE_ENV || "production",
        DATABASE_URL: process.env.DATABASE_URL,
        PORT: process.env.PORT || 4001,
        CORS_ORIGINS: process.env.CORS_ORIGINS,
        JWT_SECRET: process.env.JWT_SECRET,
        ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
      },
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
    {
      name: "tms-web",
      cwd: "./apps/web",
      script: "node_modules/.bin/next",
      args: `start -p ${process.env.FRONTEND_PORT || 3003}`,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: process.env.NODE_ENV || "production",
        API_BASE_URL: process.env.API_BASE_URL,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        FRONTEND_PORT: process.env.FRONTEND_PORT || 3003,
      },
      error_file: "./logs/web-error.log",
      out_file: "./logs/web-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};

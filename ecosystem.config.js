const path = require("node:path");

const rootDir = __dirname;
const logsDir = path.join(rootDir, "logs", "pm2");

function rootPath(...segments) {
  return path.join(rootDir, ...segments);
}

module.exports = {
  apps: [
    {
      name: "egitim-gurmesi-api",
      cwd: rootDir,
      script: rootPath("apps", "api", "dist", "main.js"),
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.API_PORT || "4000"
      },
      error_file: path.join(logsDir, "api-error.log"),
      out_file: path.join(logsDir, "api-out.log"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    },
    {
      name: "egitim-gurmesi-web",
      cwd: rootPath("apps", "web"),
      script: rootPath("node_modules", "next", "dist", "bin", "next"),
      args: `start -p ${process.env.WEB_PORT || "3000"}`,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "768M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.WEB_PORT || "3000"
      },
      error_file: path.join(logsDir, "web-error.log"),
      out_file: path.join(logsDir, "web-out.log"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    },
    {
      name: "egitim-gurmesi-admin",
      cwd: rootPath("apps", "admin"),
      script: rootPath("node_modules", "next", "dist", "bin", "next"),
      args: `start -p ${process.env.ADMIN_PORT || "3001"}`,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "768M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.ADMIN_PORT || "3001"
      },
      error_file: path.join(logsDir, "admin-error.log"),
      out_file: path.join(logsDir, "admin-out.log"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
};

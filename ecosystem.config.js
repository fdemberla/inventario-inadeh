module.exports = {
  apps: [
    {
      name: "Inventario",
      script: "node_modules/next/dist/bin/next", // Direct path to Next.js binary
      args: "start -p 3004",
      instances: 1,
      exec_mode: "fork",
      cwd: "D:\\sitios\\inventario-inadeh",

      // Remove cmd interpreter - use node directly
      // interpreter: 'cmd',  // REMOVE THIS
      // interpreter_args: '/c',  // REMOVE THIS

      // Logging
      error_file: "./logs/inventario-error.log",
      out_file: "./logs/inventario-out.log",
      log_file: "./logs/inventario-combined.log",
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Restart behavior
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,

      env: {
        NODE_ENV: "production",
        PORT: 3004,
      },
    },
  ],
};

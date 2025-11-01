module.exports = {
  apps: [
    {
      name: 'xsread-backend',
      script: 'src/app.js',
      cwd: '/www/wwwroot/xs.momofx.cn/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 8005
      },
      error_file: '../logs/backend-error.log',
      out_file: '../logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'xsread-admin-backend',
      script: 'src/app.js',
      cwd: '/www/wwwroot/xs.momofx.cn/admin-backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 8001
      },
      error_file: '../logs/admin-error.log',
      out_file: '../logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};

module.exports = {
  apps: [
    {
      name: "iskcon-server",
      script: "./server.js",
      instances: "max",
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
        PORT: 5000
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 5000
      }
    }
  ]
};

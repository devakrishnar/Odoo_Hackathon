import app from './app.js';
import { config } from './config/env.js';

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(` Brightloop Shared Backend Server running on port ${config.port}`);
  console.log(` Environment : ${config.nodeEnv}`);
  console.log(` Health check: http://localhost:${config.port}/api/health`);
  console.log(` Origins     : ${config.corsOrigins.join(', ')}`);
  console.log(`====================================================`);
});

const gracefulShutdown = () => {
  console.log('\nShutting down server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

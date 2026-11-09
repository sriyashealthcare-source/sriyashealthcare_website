const path = require('path');
const fs = require('fs');

// Ensure server/node_modules is loaded even when started from repository root
const serverNodeModules = path.join(__dirname, 'node_modules');
if (fs.existsSync(serverNodeModules) && !module.paths.includes(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const { connectDatabase } = require('./config/database');
const { configureCloudinary } = require('./config/cloudinary');
const { ensureSeededOnStartup } = require('../scripts/seedProducts');

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    await connectDatabase();
    configureCloudinary();
    await ensureSeededOnStartup();

    const server = app.listen(PORT, HOST, () => {
      console.log(`═══════════════════════════════════════════════════════════`);
      console.log(`  Sriyas Healthcare Backend Server listening on http://${HOST}:${PORT}`);
      console.log(`  Health check: http://${HOST}:${PORT}/api/health`);
      console.log(`═══════════════════════════════════════════════════════════`);
    });

    process.on('unhandledRejection', (err) => {
      console.error('[Process] Unhandled Rejection:', err.message);
    });

    process.on('SIGTERM', () => {
      console.log('[Process] SIGTERM received, shutting down gracefully.');
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error('[Server] Fatal startup error:', error.message);
    process.exit(1);
  }
}

startServer();


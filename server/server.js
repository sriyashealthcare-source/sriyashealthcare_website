const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const { connectDatabase } = require('./config/database');
const { configureCloudinary } = require('./config/cloudinary');
const { ensureSeededOnStartup } = require('../scripts/seedProducts');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();
    configureCloudinary();
    await ensureSeededOnStartup();

    const server = app.listen(PORT, () => {
      console.log(`═══════════════════════════════════════════════════════════`);
      console.log(`  Sriyas Healthcare Backend Server listening on port ${PORT}`);
      console.log(`  Health check: http://localhost:${PORT}/api/health`);
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


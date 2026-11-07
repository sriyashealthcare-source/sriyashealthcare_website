const mongoose = require('mongoose');
const { activateLocalDbAdapter, dbFilePath } = require('../utils/localDbEngine');

let dbStatus = {
  connected: false,
  mode: 'uninitialized',
  uriConfigured: false,
  error: null
};

const connectDatabase = async () => {
  const mongoUri = (process.env.MONGODB_URI || '').trim();
  dbStatus.uriConfigured = Boolean(mongoUri);

  if (mongoUri) {
    try {
      mongoose.set('strictQuery', true);
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000
      });

      dbStatus = {
        connected: true,
        mode: 'mongodb-atlas',
        uriConfigured: true,
        host: conn.connection.host,
        error: null
      };

      console.log(`[Database] Connected to MongoDB: ${conn.connection.host}`);

      mongoose.connection.on('error', (err) => {
        console.error('[Database] MongoDB connection error:', err.message);
        dbStatus.error = err.message;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[Database] MongoDB disconnected');
        dbStatus.connected = false;
      });

      return dbStatus;
    } catch (error) {
      console.error('[Database] Failed to connect to MONGODB_URI:', error.message);
      dbStatus.error = error.message;
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      console.warn('[Database] Falling back to local development database adapter.');
    }
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI environment variable is required in production.');
  }

  // Local development fallback when MONGODB_URI is not yet supplied
  activateLocalDbAdapter();
  dbStatus = {
    connected: true,
    mode: 'local-file-db',
    uriConfigured: Boolean(mongoUri),
    storagePath: dbFilePath,
    error: dbStatus.error
  };
  console.log('[Database] Running with local persistent development DB adapter (set MONGODB_URI in .env for MongoDB Atlas).');
  return dbStatus;
};

const getDatabaseStatus = () => dbStatus;

module.exports = {
  connectDatabase,
  getDatabaseStatus
};


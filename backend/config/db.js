const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://localhost:27017/intellicart_ai';
  try {
    const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 4000 });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (primaryUri !== 'mongodb://localhost:27017/intellicart_ai') {
      console.warn(`[Database Warning] Primary MongoDB connection failed (${error.message}). Attempting fallback to local MongoDB...`);
      try {
        const localConn = await mongoose.connect('mongodb://localhost:27017/intellicart_ai', { serverSelectionTimeoutMS: 4000 });
        console.log(`[Database] Fallback Connected to Local MongoDB: ${localConn.connection.host}`);
        return localConn;
      } catch (localErr) {
        console.error(`[Database Error] Local MongoDB fallback also failed: ${localErr.message}`);
        process.exit(1);
      }
    }
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

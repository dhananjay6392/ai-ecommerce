require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to Database and start listener
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[IntelliCart Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (err) => {
      console.error(`[Unhandled Rejection]: ${err.message}`);
      server.close(() => process.exit(1));
    });

    return server;
  } catch (error) {
    console.error(`[Fatal Bootstrap Error]: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = startServer;

const mongoose = require('mongoose');

let dbConnectionInfo = {
  status: 'DISCONNECTED',
  type: 'NONE',
  host: null,
  name: null,
  primaryTarget: null,
  fallbackActive: false,
  primaryDiagnostic: null,
};

const maskUri = (uri) => {
  try {
    const parsed = new URL(uri);
    return `${parsed.protocol}//${parsed.username ? '***@' : ''}${parsed.host}${parsed.pathname}`;
  } catch {
    return 'mongodb://[configured-uri]';
  }
};

const { execSync } = require('child_process');

// Helper to synthesize standard replica-set URI from SRV on Windows when c-ares fails
const resolveAtlasSrvFallback = (srvUri) => {
  if (process.platform !== 'win32') return null;
  try {
    const match = srvUri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?#]+)(\/?[^?#]*)(\?.*)?$/);
    if (!match) return null;
    const [, user, pass, host, pathPart] = match;
    const hostsOut = execSync(
      `powershell -NoProfile -Command "(Resolve-DnsName -Name _mongodb._tcp.${host} -Type SRV).NameTarget"`,
      { encoding: 'utf8', timeout: 5000 }
    );
    const hosts = hostsOut
      .trim()
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!hosts.length) return null;

    let txtOut = '';
    try {
      txtOut = execSync(
        `powershell -NoProfile -Command "(Resolve-DnsName -Name ${host} -Type TXT).Strings"`,
        { encoding: 'utf8', timeout: 4000 }
      ).trim();
    } catch (_) {}

    const db = pathPart && pathPart !== '/' ? pathPart : '/intellicart_ai';
    const hostsWithPort = hosts.map((h) => (h.includes(':') ? h : `${h}:27017`)).join(',');
    const extra = txtOut ? `&${txtOut}` : '&authSource=admin';
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${hostsWithPort}${db}?ssl=true${extra}&retryWrites=true&w=majority`;
  } catch {
    return null;
  }
};

const diagnoseConnectionError = (error) => {
  const msg = error.message || '';
  if (msg.includes('EBADRESP') || msg.includes('ENOTFOUND') || msg.includes('querySrv') || error.code === 'ENOTFOUND') {
    return {
      category: 'DNS_RESOLUTION',
      message: `[DNS Error] SRV/Host lookup failed (${msg}). Windows UDP resolver failed on mongodb+srv://. Use standard replica set URI or set DNS to 8.8.8.8.`,
    };
  }
  if (msg.includes('bad auth') || msg.includes('authentication failed') || msg.includes('AuthenticationFailed')) {
    return {
      category: 'AUTHENTICATION',
      message: '[Auth Error] MongoDB authentication failed. Verify database username and password in MongoDB Atlas Database Access (not Atlas website login).',
    };
  }
  if (msg.includes('SSL') || msg.includes('tlsv1') || msg.includes('certificate') || msg.includes('alert number 80')) {
    return {
      category: 'TLS_SECURITY',
      message: '[TLS/SSL Error] TLS handshake dropped or rejected. If Atlas proxy dropped connection with alert 80, your client IP is likely not whitelisted in Atlas Network Access.',
    };
  }
  if (msg.includes('Could not connect to any servers') || msg.includes('timed out') || error.name === 'MongooseServerSelectionError') {
    return {
      category: 'IP_ALLOWLIST_NETWORK',
      message: '[IP Allowlist/Network Error] Server selection timed out. Your current public IP address is likely not added to MongoDB Atlas Network Access (0.0.0.0/0 for anywhere).',
    };
  }
  return {
    category: 'GENERAL_ERROR',
    message: `[Database Connection Error]: ${msg}`,
  };
};

const connectDB = async () => {
  // If running in automated test suite, isolate into dedicated test database
  if (process.env.NODE_ENV === 'test') {
    const testUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/intellicart_test_db';
    try {
      const conn = await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });
      dbConnectionInfo = {
        status: 'CONNECTED',
        type: 'TEST_ISOLATED',
        host: conn.connection.host,
        name: conn.connection.name,
        primaryTarget: testUri,
        fallbackActive: false,
        primaryDiagnostic: null,
      };
      return conn;
    } catch (testErr) {
      console.error(`[Database Error] Test database connection failed: ${testErr.message}`);
      throw testErr;
    }
  }

  const primaryUri = process.env.MONGO_URI || 'mongodb://localhost:27017/intellicart_ai';
  const isDev = (process.env.NODE_ENV || 'development') !== 'production';
  const isAtlas = primaryUri.includes('mongodb+srv://') || primaryUri.includes('mongodb.net');

  try {
    let conn;
    try {
      conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 4000 });
    } catch (initialErr) {
      // If SRV lookup failed on Windows with EBADRESP, try WinDNS synthesis
      if (initialErr.message && initialErr.message.includes('EBADRESP') && primaryUri.startsWith('mongodb+srv://')) {
        console.warn('[Database] Windows Node c-ares DNS SRV lookup failed. Attempting WinDNS replica set synthesis...');
        const directUri = resolveAtlasSrvFallback(primaryUri);
        if (directUri) {
          conn = await mongoose.connect(directUri, { serverSelectionTimeoutMS: 4000 });
          console.log('[Database] Connected to Atlas via native DNS resolver fallback!');
        } else {
          throw initialErr;
        }
      } else {
        throw initialErr;
      }
    }

    console.log(`[Database] MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name || 'default'})`);
    dbConnectionInfo = {
      status: 'CONNECTED',
      type: isAtlas ? 'ATLAS_PRIMARY' : 'LOCAL_PRIMARY',
      host: conn.connection.host,
      name: conn.connection.name,
      primaryTarget: maskUri(primaryUri),
      fallbackActive: false,
      primaryDiagnostic: null,
    };
    return conn;
  } catch (error) {
    const maskedHost = maskUri(primaryUri);
    const diag = diagnoseConnectionError(error);

    console.warn(`[Database Warning] Failed to connect to primary MongoDB (${maskedHost}): ${diag.message}`);

    // In development mode, allow connecting to local MongoDB if primary fails, with explicit notice
    if (isDev && primaryUri !== 'mongodb://localhost:27017/intellicart_ai') {
      console.warn('================================================================================');
      console.warn('[DATABASE ENVIRONMENT NOTICE — LOCAL DEVELOPMENT FALLBACK ACTIVE]');
      console.warn(`Primary Target: ${maskedHost}`);
      console.warn(`Category: ${diag.category}`);
      console.warn(`Diagnostic: ${diag.message}`);
      console.warn('');
      console.warn('ACTION REQUIRED FOR ATLAS:');
      if (diag.category === 'AUTHENTICATION') {
        console.warn('-> Check MongoDB Atlas -> Database Access -> Database Users.');
      } else if (diag.category === 'IP_ALLOWLIST_NETWORK' || diag.category === 'TLS_SECURITY') {
        console.warn('-> Check MongoDB Atlas -> Network Access -> Add Current IP Address (or 0.0.0.0/0).');
      } else if (diag.category === 'DNS_RESOLUTION') {
        console.warn('-> Use direct replica set connection string or configure router/system DNS.');
      }
      console.warn('CONSEQUENCES:');
      console.warn('- Local development MongoDB is serving requests (mongodb://localhost:27017/intellicart_ai).');
      console.warn('================================================================================');

      try {
        const localConn = await mongoose.connect('mongodb://localhost:27017/intellicart_ai', { serverSelectionTimeoutMS: 4000 });
        console.log(`[Database] Connected to Local Development MongoDB: ${localConn.connection.host} (DB: ${localConn.connection.name})`);
        dbConnectionInfo = {
          status: 'CONNECTED',
          type: 'LOCAL_DEV_FALLBACK',
          host: localConn.connection.host,
          name: localConn.connection.name,
          primaryTarget: maskedHost,
          fallbackActive: true,
          primaryDiagnostic: diag.message,
        };
        return localConn;
      } catch (localErr) {
        console.error(`[Database Error] Local MongoDB connection failed: ${localErr.message}`);
        dbConnectionInfo = {
          status: 'DISCONNECTED',
          type: 'FAILED',
          host: null,
          name: null,
          primaryTarget: maskedHost,
          fallbackActive: false,
          primaryDiagnostic: `Primary DB (${diag.message}) and local fallback both failed: ${localErr.message}`,
        };
        throw new Error(`Primary DB (${diag.message}) and local fallback DB both failed: ${localErr.message}`);
      }
    }

    dbConnectionInfo = {
      status: 'DISCONNECTED',
      type: 'FAILED',
      host: null,
      name: null,
      primaryTarget: maskedHost,
      fallbackActive: false,
      primaryDiagnostic: diag.message,
    };
    throw error;
  }
};

connectDB.getConnectionInfo = () => ({ ...dbConnectionInfo });

module.exports = connectDB;

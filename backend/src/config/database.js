require('dotenv').config();
const { parse } = require('pg-connection-string');

const parseDatabaseUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = parse(url);
    return {
      username: parsed.user,
      password: parsed.password,
      database: parsed.database,
      host: parsed.host,
      port: parseInt(parsed.port, 10) || 5432,
      dialect: 'postgres',
      ssl: parsed.ssl || parsed.host !== 'localhost',
      dialectOptions: (parsed.ssl || parsed.host !== 'localhost')
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : undefined,
    };
  } catch (e) {
    console.warn('[database] Failed to parse DATABASE_URL:', e.message);
    return null;
  }
};

const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL);

const baseConfig = fromUrl || {
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'agrolens',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  dialect: 'postgres',
};

const loggingMode = () => {
  if (process.env.DB_LOGGING === 'false') return false;
  if (process.env.DB_LOGGING === 'true') return console.log;
  return process.env.NODE_ENV === 'development' ? console.log : false;
};

const poolBase = {
  max: parseInt(process.env.DB_POOL_MAX, 10) || (process.env.NODE_ENV === 'production' ? 10 : 5),
  min: parseInt(process.env.DB_POOL_MIN, 10) || (process.env.NODE_ENV === 'production' ? 2 : 0),
  acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 60000,
  idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
};

const production = {
  ...baseConfig,
  logging: loggingMode(),
  pool: poolBase,
  dialectOptions: baseConfig.dialectOptions || {
    ssl: { require: true, rejectUnauthorized: false },
  },
  ssl: process.env.DB_SSL === 'true' ? true : baseConfig.ssl,
};

if (production.ssl && !production.dialectOptions) {
  production.dialectOptions = { ssl: { require: true, rejectUnauthorized: false } };
}

module.exports = {
  development: {
    ...baseConfig,
    logging: loggingMode(),
    pool: { ...poolBase, max: 5, min: 0 },
    dialectOptions: baseConfig.dialectOptions || {},
  },
  test: {
    ...baseConfig,
    logging: false,
    pool: { ...poolBase, max: 5, min: 0 },
  },
  production,
};

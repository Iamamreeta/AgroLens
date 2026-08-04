require('dotenv').config();

const parseDatabaseUrl = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      username: u.username || process.env.DB_USERNAME,
      password: u.password || process.env.DB_PASSWORD,
      database: (u.pathname || '').replace(/^\//, '') || process.env.DB_NAME,
      host: u.hostname || process.env.DB_HOST,
      port: u.port ? parseInt(u.port, 10) : (process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432),
      dialect: (u.protocol || '').replace(':', '') || 'postgres',
      ssl: /sslmode=require|ssl=true/.test(url) ? { require: true, rejectUnauthorized: false } : false,
    };
  } catch (e) {
    return null;
  }
};

const buildConfig = (env) => {
  const fromUrl = env === 'production' ? parseDatabaseUrl(process.env.DATABASE_URL) : parseDatabaseUrl(process.env.DATABASE_URL);
  if (fromUrl) {
    return {
      use_env_variable: undefined,
      username: fromUrl.username,
      password: fromUrl.password,
      database: fromUrl.database,
      host: fromUrl.host,
      port: fromUrl.port,
      dialect: fromUrl.dialect || 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: parseInt(process.env.DB_POOL_MAX, 10) || (env === 'production' ? 10 : 5),
        min: parseInt(process.env.DB_POOL_MIN, 10) || (env === 'production' ? 2 : 0),
        acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || (env === 'production' ? 60000 : 30000),
        idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
      },
      define: {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      dialectOptions: fromUrl.ssl ? { ssl: fromUrl.ssl } : undefined,
    };
  }

  const prodSsl = process.env.DB_SSL === 'true'
    ? { require: true, rejectUnauthorized: false }
    : undefined;

  return {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || (env === 'test' ? 'agrolens_test' : 'agrolens'),
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' && env !== 'production' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || (env === 'production' ? 10 : 5),
      min: parseInt(process.env.DB_POOL_MIN, 10) || (env === 'production' ? 2 : 0),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || (env === 'production' ? 60000 : 30000),
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    dialectOptions: prodSsl ? { ssl: prodSsl } : undefined,
  };
};

module.exports = {
  development: buildConfig('development'),
  test: buildConfig('test'),
  production: buildConfig('production'),
};

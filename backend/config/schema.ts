import { defaults } from './defaults';

export interface SchemaField {
  env?: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'url' | 'email' | 'phone' | 'date' | 'uuid';
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: string[];
  sensitive?: boolean;
  sanitize?: 'trim' | 'lowercase';
  description?: string;
  fields?: Record<string, SchemaField>;
  items?: SchemaField;
  uniqueItems?: boolean;
}

export type ConfigurationSchema = Record<string, Record<string, SchemaField>>;

export const schema: ConfigurationSchema = {
  SERVER: {
    PORT: {
      env: 'PORT',
      type: 'number',
      required: true,
      default: defaults.SERVER.PORT,
      min: 1024,
      max: 65535,
      description: 'The port Express.js server runs on'
    },
    HOST: {
      env: 'HOST',
      type: 'string',
      required: true,
      default: defaults.SERVER.HOST,
      pattern: /^(localhost|0\.0\.0\.0|(\d{1,3}\.){3}\d{1,3})$/,
      description: 'Server bind address (hostname or IP)'
    },
    NODE_ENV: {
      env: 'NODE_ENV',
      type: 'string',
      required: true,
      default: defaults.SERVER.NODE_ENV,
      enum: ['development', 'staging', 'production', 'test'],
      description: 'Application environment'
    },
    API_VERSION: {
      type: 'string',
      default: 'v4',
      enum: ['v1', 'v2', 'v3', 'v4'],
      description: 'Default version for API endpoints'
    },
    API_PREFIX: {
      type: 'string',
      default: defaults.SERVER.API_PREFIX,
      pattern: /^\/[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/,
      description: 'Prefix path for all routes'
    }
  },

  DATABASE: {
    CLIENT: {
      env: 'DB_CLIENT',
      type: 'string',
      required: true,
      default: defaults.DATABASE.CLIENT,
      enum: ['postgresql', 'pg', 'mysql'],
      description: 'Database client driver'
    },
    HOST: {
      env: 'DB_HOST',
      type: 'string',
      required: true,
      default: defaults.DATABASE.HOST,
      description: 'Database server host address'
    },
    PORT: {
      env: 'DB_PORT',
      type: 'number',
      required: true,
      default: defaults.DATABASE.PORT,
      min: 1,
      max: 65535,
      description: 'Database server port'
    },
    USER: {
      env: 'DB_USER',
      type: 'string',
      required: true,
      default: defaults.DATABASE.USER,
      description: 'Database username'
    },
    PASSWORD: {
      env: 'DB_PASSWORD',
      type: 'string',
      required: true,
      sensitive: true,
      default: defaults.DATABASE.PASSWORD,
      description: 'Database user password'
    },
    NAME: {
      env: 'DB_NAME',
      type: 'string',
      required: true,
      default: defaults.DATABASE.NAME,
      pattern: /^[a-zA-Z0-9_]+$/,
      description: 'Database instance name'
    },
    SCHEMA: {
      type: 'string',
      default: 'public',
      description: 'Database default schema context'
    },
    SSL: {
      type: 'boolean',
      default: defaults.DATABASE.SSL,
      description: 'Enable encrypted SSL database connection'
    },
    POOL: {
      type: 'object',
      description: 'Database connection pool properties',
      fields: {
        MIN: { type: 'number', default: defaults.DATABASE.POOL_MIN, min: 0 },
        MAX: { type: 'number', default: defaults.DATABASE.POOL_MAX, min: 1 },
        IDLE_TIMEOUT_MS: { type: 'number', default: 30000 },
        ACQUIRE_TIMEOUT_MS: { type: 'number', default: 60000 }
      }
    }
  },

  SECURITY: {
    JWT: {
      type: 'object',
      description: 'JSON Web Token options',
      fields: {
        SECRET: {
          env: 'JWT_SECRET',
          type: 'string',
          required: true,
          minLength: 32,
          sensitive: true,
          description: 'Secret crypt-key used to sign Auth tokens'
        },
        ACCESS_EXPIRES_IN: { type: 'number', default: 86400, min: 300 },
        REFRESH_EXPIRES_IN: { type: 'number', default: 604800, min: 3600 },
        ALGORITHM: { type: 'string', default: 'HS256', enum: ['HS256', 'HS384', 'HS512'] }
      }
    },
    OTP: {
      type: 'object',
      description: 'One-Time Password options',
      fields: {
        LENGTH: { type: 'number', default: 6, min: 4, max: 8 },
        EXPIRES_IN: { type: 'number', default: 300 },
        MAX_ATTEMPTS: { type: 'number', default: 3 }
      }
    },
    PASSWORD: {
      type: 'object',
      description: 'Password security rules',
      fields: {
        BCRYPT_ROUNDS: { type: 'number', default: 12, min: 10, max: 20 },
        MIN_LENGTH: { type: 'number', default: 8 }
      }
    },
    RATE_LIMIT: {
      type: 'object',
      description: 'Express rate limiting configurations',
      fields: {
        ENABLED: { type: 'boolean', default: true },
        WINDOW_MS: { type: 'number', default: 900000 },
        MAX_REQUESTS: { type: 'number', default: 100 }
      }
    }
  },

  APP: {
    NAME: { type: 'string', required: true, default: defaults.METADATA.APP_NAME, minLength: 3 },
    NAME_FA: { type: 'string', default: 'روشنا' },
    URL: { env: 'APP_URL', type: 'url', required: true, default: defaults.URLS.APP_URL },
    LOCALE: { type: 'string', default: 'fa', enum: ['fa', 'en', 'ar', 'tr'] },
    TIMEZONE: { type: 'string', default: 'Asia/Tehran' },
    DEBUG: { type: 'boolean', default: false }
  },

  ROSHANA_SCI: {
    ENABLED: { type: 'boolean', default: true },
    ANOMALY_DETECTION: { type: 'boolean', default: true },
    PROXY_TIMEOUT: { type: 'number', default: 10000, min: 1000 },
    CACHE: {
      type: 'object',
      fields: {
        ENABLED: { type: 'boolean', default: true },
        TTL_DEFAULT: { type: 'number', default: 3600 },
        MAX_SIZE_MB: { type: 'number', default: 1024 }
      }
    }
  },

  NOTIFICATION: {
    EMAIL: {
      type: 'object',
      fields: {
        ENABLED: { type: 'boolean', default: false },
        HOST: { env: 'SMTP_HOST', type: 'string' },
        USER: { env: 'SMTP_USER', type: 'string' },
        PASSWORD: { env: 'SMTP_PASSWORD', type: 'string', sensitive: true }
      }
    },
    SMS: {
      type: 'object',
      fields: {
        ENABLED: { type: 'boolean', default: false },
        PROVIDER: { type: 'string', default: 'farazsms', enum: ['kavenegar', 'ghasedak', 'farazsms'] }
      }
    }
  },

  UPLOAD: {
    DRIVER: { type: 'string', default: 'local', enum: ['local', 's3', 'gcs'] },
    MAX_FILE_SIZE_MB: { type: 'number', default: 50 },
    ALLOWED_TYPES: {
      type: 'object',
      fields: {
        IMAGES: { type: 'array', default: ['jpg', 'jpeg', 'png', 'webp'] }
      }
    }
  },

  LOGGING: {
    LEVEL: { env: 'LOG_LEVEL', type: 'string', default: defaults.LOGGER.LEVEL, enum: ['error', 'warn', 'info', 'debug'] },
    DATABASE_ENABLED: { type: 'boolean', default: true }
  },

  CACHE: {
    ENABLED: { type: 'boolean', default: defaults.CACHE.ENABLED, description: 'Enable system-wide standard cache layer' },
    DEFAULT_TTL_SECONDS: { type: 'number', default: defaults.CACHE.TTL / 1000 }
  }
};

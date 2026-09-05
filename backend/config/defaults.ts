export interface RoshanaDefaults {
  SERVER: {
    PORT: number;
    HOST: string;
    NODE_ENV: 'development' | 'staging' | 'production' | 'test';
    API_PREFIX: string;
    REQUEST_TIMEOUT: number;
  };
  SECURITY: {
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    BCRYPT_ROUNDS: number;
    CORS_ENABLED: boolean;
  };
  DATABASE: {
    CLIENT: 'postgresql' | 'pg' | 'mysql';
    HOST: string;
    PORT: number;
    USER: string;
    PASSWORD: string;
    NAME: string;
    SSL: boolean;
    POOL_MIN: number;
    POOL_MAX: number;
  };
  CACHE: {
    ENABLED: boolean;
    DRIVER: 'memory' | 'redis';
    TTL: number;
  };
  LOGGER: {
    LEVEL: 'error' | 'warn' | 'info' | 'debug';
    FILE_ENABLED: boolean;
    CONSOLE_ENABLED: boolean;
  };
  UPLOAD: {
    MAX_FILE_SIZE: number;
    PATH: string;
  };
  URLS: {
    APP_URL: string;
    API_URL: string;
    FRONTEND_URL: string;
  };
  METADATA: {
    APP_NAME: string;
    APP_VERSION: string;
  };
}

export const defaults: RoshanaDefaults = {
  SERVER: {
    PORT: 3000,
    HOST: '0.0.0.0',
    NODE_ENV: 'development',
    API_PREFIX: '/api/v1',
    REQUEST_TIMEOUT: 30000
  },
  SECURITY: {
    JWT_SECRET: 'change-me-at-least-32-characters-long',
    JWT_EXPIRES_IN: '7d',
    BCRYPT_ROUNDS: 12,
    CORS_ENABLED: true
  },
  DATABASE: {
    CLIENT: 'postgresql',
    HOST: '127.0.0.1',
    PORT: 5432,
    USER: 'postgres',
    PASSWORD: '',
    NAME: 'roshana_db',
    SSL: false,
    POOL_MIN: 2,
    POOL_MAX: 10
  },
  CACHE: {
    ENABLED: true,
    DRIVER: 'memory',
    TTL: 300000
  },
  LOGGER: {
    LEVEL: 'info',
    FILE_ENABLED: true,
    CONSOLE_ENABLED: true
  },
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    PATH: './public/uploads'
  },
  URLS: {
    APP_URL: 'http://localhost:3000',
    API_URL: 'http://localhost:3000/api/v1',
    FRONTEND_URL: 'http://localhost:5173'
  },
  METADATA: {
    APP_NAME: 'Roshana',
    APP_VERSION: '4.1.0'
  }
};

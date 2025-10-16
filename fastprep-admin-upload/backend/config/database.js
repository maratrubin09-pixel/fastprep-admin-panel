require('dotenv').config();

module.exports = {
  development: {
    username: null,
    password: null,
    database: './database.sqlite',
    host: null,
    port: null,
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
  },
  test: {
    username: null,
    password: null,
    database: './test.sqlite',
    host: null,
    port: null,
    dialect: 'sqlite',
    storage: './test.sqlite',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

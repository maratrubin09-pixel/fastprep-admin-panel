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
    use_env_variable: 'DATABASE_URL',
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

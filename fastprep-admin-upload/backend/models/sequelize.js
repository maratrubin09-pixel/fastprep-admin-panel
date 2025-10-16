const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];
let sequelize;

if (dbConfig.use_env_variable && process.env[dbConfig.use_env_variable]) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], {
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    dialectOptions: dbConfig.dialectOptions || {},
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      dialectOptions: dbConfig.dialectOptions || {},
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
    }
  );
}

module.exports = sequelize;

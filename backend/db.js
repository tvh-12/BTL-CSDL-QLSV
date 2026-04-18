const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'your_password',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'QLSV',
  options: {
    encrypt: false, 
    trustServerCertificate: true,
    instanceName: process.env.DB_INSTANCE
  }
};

const pool = new sql.ConnectionPool(config);
const poolPromise = pool.connect()
  .then(() => {
    console.log('Connected to SQL Server successfully!');
    return pool;
  })
  .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

module.exports = {
  sql, poolPromise
};

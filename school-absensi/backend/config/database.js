const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_absensi',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  timezone: '+07:00',
  charset: 'utf8mb4'
});

pool.getConnection()
  .then(conn => {
    console.log('✅ Database connected');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = pool;

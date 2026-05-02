import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'aceai_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;

// Helper to initialize tables
export async function initDb() {
  const connection = await pool.getConnection();
  try {
    console.log('⚡ Initializing MySQL Tables...');
    
    // 1. Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Profiles Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(36) PRIMARY KEY,
        credits INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 3. Sessions Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        company VARCHAR(255),
        role VARCHAR(255),
        language VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 4. Documents Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ MySQL Database Initialized Successfully.');
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err);
  } finally {
    connection.release();
  }
}

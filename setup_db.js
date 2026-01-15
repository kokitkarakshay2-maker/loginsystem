require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
};

async function setupDatabase() {
    let connection;
    try {
        // Connect to MySQL server (without database)
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL server.');

        // Create Database
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'login_system_db'}\``);
        console.log(`Database '${process.env.DB_NAME || 'login_system_db'}' created or already exists.`);

        // Switch to the database
        await connection.changeUser({ database: process.env.DB_NAME || 'login_system_db' });

        // Create Users Table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await connection.query(createTableQuery);
        console.log('Users table checked/created.');

        // Check if admin exists
        const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);

        if (rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin']);
            console.log('Default Admin created: username=admin, password=admin123');
        } else {
            console.log('Admin user already exists.');
        }

    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();

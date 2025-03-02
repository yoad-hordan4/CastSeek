const sql = require("mssql");
require("dotenv").config();

// ✅ Azure SQL Database Connection Configuration
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    port: 1433,
    options: { encrypt: true, trustServerCertificate: false },
};

// ✅ Function to Connect to Database
async function connectDB() {
    try {
        const pool = await sql.connect(config);
        console.log("✅ Connected to Azure SQL Database!");
        return pool;
    } catch (err) {
        console.error("❌ Database Connection Error:", err);
        throw err;
    }
}

// ✅ Function to Initialize Database (Run Once)
async function initializeDatabase() {
    try {
        const pool = await connectDB();
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tokens' AND xtype='U')
            CREATE TABLE Tokens (
                id INT PRIMARY KEY CHECK (id = 1),  -- Only one row allowed
                accessToken NVARCHAR(MAX) NOT NULL,
                refreshToken NVARCHAR(MAX) NOT NULL,
                tokenExpiration BIGINT NOT NULL
            );

            -- Ensure a single row exists
            IF NOT EXISTS (SELECT * FROM Tokens WHERE id = 1)
            INSERT INTO Tokens (id, accessToken, refreshToken, tokenExpiration) 
            VALUES (1, '', '', 0);
        `);
        console.log("✅ Tokens table initialized!");
    } catch (err) {
        console.error("❌ Error initializing database:", err);
    }
}

// ✅ Function to Save Tokens (Always Updates the Same Row)
async function saveTokensToDB(accessToken, refreshToken, tokenExpiration) {
    try {
        const pool = await connectDB();
        await pool.request().query(`
            UPDATE Tokens 
            SET accessToken = '${accessToken}', 
                refreshToken = '${refreshToken}', 
                tokenExpiration = ${tokenExpiration}
            WHERE id = 1;
        `);
        console.log("✅ Tokens updated in database!");
    } catch (err) {
        console.error("❌ Error saving tokens:", err);
    }
}

// ✅ Function to Get the Latest Token from the Database
async function getLatestToken() {
    try {
        const pool = await connectDB();
        const result = await pool.request().query("SELECT * FROM Tokens WHERE id = 1");
        return result.recordset[0]; // Return the latest token
    } catch (err) {
        console.error("❌ Error retrieving token:", err);
        return null;
    }
}

module.exports = { connectDB, initializeDatabase, saveTokensToDB, getLatestToken };

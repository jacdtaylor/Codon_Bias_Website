const PropertiesReader = require('properties-reader');
const mysql = require('mysql2/promise');

let pool;

function initializePool() {
    const properties = PropertiesReader('./database/db.properties');

    // Initialize the connection pool
    pool = mysql.createPool({
        host: properties.get('db.host'),
        user: properties.get('db.user'),
        password: properties.get('db.password'),
        database: properties.get('db.name'),
        waitForConnections: true,
        connectionLimit: 10, // Adjust based on your database server's capacity
        queueLimit: 0, // 0 means no limit on request queuing
    });
}

// Ensure the pool is initialized only once
initializePool();

export default async function handler(req, res) {
    const { species } = req.query;

    // Validate and sanitize the species parameter
   

    try {
        // Dynamically inject the validated table name into the query
        const query = `SELECT CAST(gene AS CHAR) AS gene FROM \`${species}\``;

        // Fetch data using the connection pool
        const [rows] = await pool.execute(query);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: "No data found for this species" });
        }

        // Extract gene names
        const geneNames = rows.map(row => row.gene);

        // Respond with the array of gene names
        res.status(200).json(geneNames);
    } catch (error) {
        console.error("Error executing query:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

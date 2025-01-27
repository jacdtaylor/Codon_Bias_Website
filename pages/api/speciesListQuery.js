const PropertiesReader = require('properties-reader');
const mysql = require('mysql2/promise');

let pool;

// Initialize the connection pool only once
function initializePool() {
    if (!pool) {
        const properties = PropertiesReader('./database/db.properties');
        pool = mysql.createPool({
            host: properties.get('db.host'),
            user: properties.get('db.user'),
            password: properties.get('db.password'),
            database: properties.get('db.name'),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
    }
}

initializePool();

export default async function handler(req, res) {
    try {
        // Example: Validating HTTP method
        if (req.method !== 'GET') {
            return res.status(405).json({ error: "Method not allowed" });
        }

        // Query to fetch species names only
        const query = `SELECT Species FROM genomeData`;

        // Execute the query using the connection pool
        const [rows] = await pool.execute(query);

        // Handle empty results
        if (rows.length === 0) {
            return res.status(404).json({ error: "No species found" });
        }

        // Extract species names
        const speciesList = rows.map(row => row.Species);

        res.status(200).json({ species: speciesList });
    } catch (error) {
        console.error("Error executing query:", error.message);

        // Log more details for debugging (avoid exposing sensitive information)
        res.status(500).json({ error: "Internal Server Error" });
    }
}

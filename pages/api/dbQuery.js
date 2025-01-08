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
    const { species, gene } = req.query;

    try {
        console.log(gene)
      

        // Dynamically inject the validated table name into the query
        const query = `SELECT data FROM \`${species}\` WHERE gene = ?`;

        // Fetch data using the connection pool
        const [rows] = await pool.execute(query, [gene]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "No data found for this species and gene" });
        }

        res.status(200).json(JSON.parse(rows[0].data));
    } catch (error) {
        console.error("Error executing query:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

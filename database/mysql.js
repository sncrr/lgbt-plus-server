const mysql = require('mysql2');
const util = require('util');

/**
 * Databse config
 * 
 * db: {
 *  host: 'localhost',
 *  port: 3306,
 *  database: 'sample',
 *  username: 'root',
 *  password: 'root'
 * }
 */
const config = require('../config');

/**
 * Create Connection
 */
const conn = mysql.createConnection({
    host: process.env.DBHOST || config.db.host,
    port: process.env.DBPORT || config.db.port,
    database: process.env.DBNAME || config.db.database,
    user: process.env.DBUSER || config.db.user,
    password: process.env.DBPASSWORD || config.db.password
});

conn.connect(err => {
    if(err) console.warn("ERROR",err);
    else console.log("Database Connected");
})

module.exports = conn;
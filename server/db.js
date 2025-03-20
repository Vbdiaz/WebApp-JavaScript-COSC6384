const mysql = require('mysql2');
const fs = require('fs')

const pool = mysql.createPool({
    host: 'mysql-344edd44-first-project1234.i.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_tWRNiEjGh9XP6kCgrdE',
    database: 'real_time_db',
    port: '26056',
    ssl: {
        ca: fs.readFileSync('portfoliomanager.pem'),
    },
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keetAliveInitialDelay: 0,
})

module.exports = pool.promise();
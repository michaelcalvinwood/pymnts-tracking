const listenPort = 6200;
const hostname = 'tracking.pymnts.com'
const privateKeyPath = `/etc/letsencrypt/live/${hostname}/privkey.pem`;
const fullchainPath = `/etc/letsencrypt/live/${hostname}/fullchain.pem`;

require('dotenv').config();
const express = require('express');
const https = require('https');
const cors = require('cors');
const fs = require('fs');
const mysql = require('mysql2');

const app = express();
app.use(express.static('public'));
app.use(express.json({limit: '200mb'})); 
app.use(cors());

const mysqlOptions = {
    connectionLimit : 5, //important
    host     : process.env.MYSQL_HOST,
    user     : process.env.MYSQL_USER,
    password : process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_DATABASE,
    debug    :  false
}

console.log(mysqlOptions);

const pool = mysql.createPool(mysqlOptions);

const query = (query) => {
    return new Promise ((resolve, reject) => {
      pool.query(query,(err, data) => {
        if(err) {
            console.error(err);
            return resolve(false);
        }
        
        return resolve(data);
    });
    })
}

const getDatabases = async () => {
    const databases = await query('SHOW DATABASES');

    console.log('databases', databases);
}

const createTable = async (table) => {
    const q = `CREATE TABLE ${table} (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL,
        path VARCHAR(512) NOT NULL,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP,
        index (user_id),
        index (path)
    )`;

    const r = await query(q);

    console.log(r);
}

createTable('test_table');

getDatabases();

const handlePageVisit = async (req, res) => {
    const { path, pymntsDeviceAuth } = req.body;
    console.log(path, pymntsDeviceAuth);
}

app.post('/pageVisit', (req, res) => handlePageVisit(req, res));

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

const httpsServer = https.createServer({
    key: fs.readFileSync(privateKeyPath),
    cert: fs.readFileSync(fullchainPath),
  }, app);
  

  httpsServer.listen(listenPort, '0.0.0.0', () => {
    console.log(`HTTPS Server running on port ${listenPort}`);
});



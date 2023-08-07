const listenPort = 6201;
const hostname = 'reporting.pymnts.com'
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

let mysqlOptions = {
    connectionLimit : 10, //important
    host     : process.env.MYSQL_LOCAL_HOST,
    user     : process.env.MYSQL_LOCAL_USER,
    password : process.env.MYSQL_LOCAL_PASSWORD,
    database : process.env.MYSQL_LOCAL_DATABASE,
    debug    :  false
}

let numPending = 0;

console.log(mysqlOptions);
const localPool = mysql.createPool(mysqlOptions);

mysqlOptions = {
    connectionLimit : 10, //important
    host     : process.env.MYSQL_REMOTE_HOST,
    user     : process.env.MYSQL_REMOTE_USER,
    password : process.env.MYSQL_REMOTE_PASSWORD,
    database : process.env.MYSQL_REMOTE_DATABASE,
    debug    :  false
}

console.log(mysqlOptions)

const remotePool = mysql.createPool(mysqlOptions);

const localQuery = (query) => {
    return new Promise ((resolve, reject) => {
      localPool.query(query,(err, data) => {
        if(err) {
            if (err.errno !== 1146) console.error(err);
            return resolve(false);
        }
        
        return resolve(data);
    });
    })
}

const remoteQuery = (query) => {
    return new Promise ((resolve, reject) => {
      remotePool.query(query,(err, data) => {
        if(err) {
            if (err.errno !== 1146) console.error(err);
            return resolve(false);
        }
        
        return resolve(data);
    });
    })
}

const getTableName = url => {
    let tableName = 'home';
    if (url === '/') return tableName;
    if (url.startsWith('/')) url = url.substring(1);
    const parts = url.split('/');

    if (parts.length < 2) tableName = 'home';
    else if (parts.length === 2) tableName = parts[0];
    else tableName = parts[0] + "_" + parts[1];

    return tableName.replaceAll('-', '_').substring(0, 64);
}

const handleTrackerLeads = async (req, res) => {

}

app.post('/trackerLeads', (req, res) => handleTrackerLeads(req, res));

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

const setupTest = async () => {

    let result = await localQuery('SHOW DATABASES');

    console.log('local databases', result);

    result = await remoteQuery('SHOW DATABASES');

    console.log('remote databases', result)
}

setupTest();
const DB_CONFIG = require('../dbconfig.json'),
    mysql = require('promise-mysql');


module.exports = function (query) {
    return mysql.createConnection(DB_CONFIG)
        .then(connection => {
            return connection.query(query).finally(() => connection.end());
        });
}

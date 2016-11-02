const DB_CONFIG = require('./dbconfig.json'),
    mysql = require('promise-mysql');
module.exports = function (tables) {
    return mysql.createConnection(DB_CONFIG)
        .then(connection => {
            return Promise.all(
                tables.map(table => connection.query(`DROP TABLE IF EXISTS \`${table}\``))
            ).then(() => connection.end())
        });
}
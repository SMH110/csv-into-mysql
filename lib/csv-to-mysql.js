const mysql = require('promise-mysql'),
    fs = require('fs'),
    DB_CONFIG = require('../dbconfig.json');


function convertFileNameToTableName(file) {

    if (file.indexOf("\\") > -1) {
        file = file.slice(file.lastIndexOf("\\") + 1);
    }

    if (file.indexOf("/") > -1) {
        file = file.slice(file.lastIndexOf("/") + 1);
    }
    if (file.indexOf("`") > -1) {
        file = file.replace(/`/g, "``");
    }

    return file.indexOf(".csv") > -1 || file.indexOf(".txt") > -1 ? `\`${file.slice(0, -4)}\`` : `\`${file}\``;
}

function escapeColumnName(string) {
    if (string.indexOf("`") > -1) {
        string = string.replace(/`/g, "``")
    }

    if (string.indexOf('"') > -1 || string.indexOf("'") > -1 || string.indexOf(" ") > -1) {
        string = `\`${string}\``
    }

    return string
}

function escapeValue(string) {
    string = string.replace(/"/g, '""');
    return `"${string}"`
}

function createTable(tableName, columns, parsedData, connection) {

    return connection.query(`CREATE TABLE ${tableName} (${columns.map(x => `${escapeColumnName(x)} TEXT`).join()})`)
        .catch(error => {
            console.error(error);
            connection.end();
            throw error;
        })
        .then(() => insertRows(tableName, parsedData, connection));
}

function insertRows(tableName, parsedData, connection) {
    return Promise.all(
        parsedData.map(row => {
            var sql = `INSERT INTO ${tableName} VALUES (${row.map(x => escapeValue(x)).join()})`;
            return connection.query(sql);
        })
    )
        .catch(error => {
            console.error(error);
            connection.end();
            throw error;
        })
        .then(() => connection.end());
}


function interface_(file, parsedData, insertingCase) {
    let tableName = convertFileNameToTableName(file);
    const columns = parsedData[0];
    return mysql.createConnection(DB_CONFIG)
        .then(connection => {
            if (insertingCase === "--overwrite") {
                return connection.query(`DROP TABLE IF EXISTS ${(tableName)}`)
                    .catch(error => {
                        console.error(error);
                        connection.end();
                        throw error;
                    })
                    .then(() => createTable(tableName, columns, parsedData.slice(1), connection));
            } else if (insertingCase === "--append") {
                return insertRows(tableName, parsedData.slice(1), connection);
            } else {
                return createTable(tableName, columns, parsedData.slice(1), connection);
            }
        });
}



module.exports = {
    interface_
}
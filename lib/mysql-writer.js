const mysql = require('promise-mysql'),
    fs = require('fs'),
    path = require('path'),
    DB_CONFIG = require('../dbconfig.json');


function convertFileNameToTableName(file) {
    if (file.indexOf("\\") > -1) {
        file = file.replace(/\\/g, "/");
    }

    let parsedPath = path.parse(file);

    if (parsedPath.name.indexOf("`") > -1) {
        parsedPath.name = parsedPath.name.replace(/`/g, "``");
    }

    return `\`${parsedPath.name}\``;
}

function escapeColumnName(string) {
    if (string.indexOf("`") > -1) {
        string = string.replace(/`/g, "``")
    }

    if (string.indexOf('"') > -1 || string.indexOf("'") > -1 || string.indexOf(" ") > -1) {
        string = `\`${string}\``
    }

    return string;
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


function writer(file, parsedData, insertingCase) {
    let tableName = convertFileNameToTableName(file);
    const columns = Object.keys(parsedData[0]);
    let rows = [];
    for (let object of parsedData) {
        let row = [];
        for (let column in object) {
            row.push(object[column])
        }
        rows.push(row);
    }
    return mysql.createConnection(DB_CONFIG)
        .then(connection => {
            if (insertingCase === "--overwrite") {
                return connection.query(`DROP TABLE IF EXISTS ${(tableName)}`)
                    .catch(error => {
                        console.error(error);
                        connection.end();
                        throw error;
                    })
                    .then(() => createTable(tableName, columns, rows, connection));
            } else if (insertingCase === "--append") {
                return insertRows(tableName, rows, connection);
            } else {
                return createTable(tableName, columns, rows, connection);
            }
        });
}



module.exports = {
    writer
}
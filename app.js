let fs = require('fs'),
    mysql = require('mysql'),
    parse = require('csv-parse');

const DB_CONFIG = require('./dbconfig.json');

// function makes any invalid csv's name valid
function convertFileNameToTableName(file) {

    if (file.indexOf("\\") > -1) {
        file = file.slice(file.lastIndexOf("\\") + 1);
    }

    if (file.indexOf("/") > -1) {
        file = file.slice(file.lastIndexOf("/") + 1);
    }

    file = file.slice(0, -4).replace(/`/g, "``");
    return "`" + file + "`";
}

function createTable(createTableQuery, parsedData, tableName, connection) {
    connection.query(createTableQuery, error => {
        if (error) {
            // If there is an error creating the table the connection never gets closed
            console.error(error);
            return;
        }
        insertRows(tableName, parsedData, connection);
    });
}

function insertRows(tableName, parsedData, connection) {
    let counter = 0;
    parsedData.forEach(row => {
        connection.query(`INSERT INTO ${tableName} VALUES (${row.map(x => {
            x = x.replace(/"/g, '\\"');
            return '"' + x + '"';
        }).join()})`, error => {
            if (++counter === parsedData.length) {
                connection.end();
            }

            if (error) {
                console.error(error);
                return;
            }
        });
    });
}

function readAndParseAndInsert(csvFiles, path, insertingCase) {
    csvFiles.forEach(file => {
        fs.readFile(`${path}${file}`, "utf8", (error, csvFile) => {
            if (error) {
                console.error(error);
                return;
            }
            let tableName = convertFileNameToTableName(file);
            parse(csvFile, (error, data) => {
                if (error) {
                    console.error(error);
                    return;
                }

                const colsName = data[0];
                let createTableQuery = `CREATE TABLE ${tableName} (`;
                let connection = mysql.createConnection(DB_CONFIG);

                if (insertingCase !== "--append") {
                    if (colsName.join().indexOf(" ") > -1 || colsName.join().indexOf("'") > -1 || colsName.join().indexOf('"') > -1) {
                        for (let column of colsName) {

                            if (column.indexOf(" ") > -1 || column.indexOf("'") > -1 || column.indexOf('"') > -1) {
                                createTableQuery += '`' + column + '`' + " TEXT, ";
                            } else {
                                createTableQuery += column + " TEXT, ";
                            }
                        }
                        createTableQuery = createTableQuery.slice(0, -2) + ")";
                    } else {
                        createTableQuery += colsName.join(" TEXT, ") + " TEXT)";
                    }
                }
                if (insertingCase === "--overwrite") {
                    connection.query(`DROP TABLE IF EXISTS ${tableName.replace(/'/g, "\\'")}`, error => {
                        if (error) {
                            console.error(error);
                            return;
                        }
                        createTable(createTableQuery, data.slice(1), tableName, connection);
                    });
                } else if (insertingCase === "--append") {
                    insertRows(tableName, data.slice(1), connection);
                } else {
                    createTable(createTableQuery, data.slice(1), tableName, connection);
                }
            });
        });
    });
}

let insertingCase,
    isUserSpecifiedFilesToInsert = false;

let args = process.argv,
    filesToInsert = [];

for (let i = 2; i < args.length; i++) {
    if (args[i] === "--files") {
        isUserSpecifiedFilesToInsert = true;
    }
    if (args[i] === '--append' || args[i] === '--overwrite') {
        insertingCase = args[i];
    }
    if ((args[i].indexOf('.csv') > -1 || args[i].indexOf('.txt') > -1) && isUserSpecifiedFilesToInsert) {
        filesToInsert.push(args[i]);
    }
}


if (isUserSpecifiedFilesToInsert) {
    // in case if someone did : [node app.js --files] and runs the program
    if (filesToInsert.length) {
        readAndParseAndInsert(filesToInsert, "./", insertingCase);
    } else {
        console.error(new Error('No CSV or TXT files specified'));
    }
} else {
    fs.readdir('./files/', (error, files) => {
        if (error) {
            console.error(error);
            return;
        }
        let csvFiles = files.filter(file => /(\.csv)$/.test(file) || /(\.txt)$/.test(file));
        if (!csvFiles.length) {
            console.error(new Error('No CSV or TXT files found'));
            return;
        }

        readAndParseAndInsert(csvFiles, "./files/", insertingCase);

    });
}
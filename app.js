let fs = require('fs'),
    mysql = require('mysql'),
    parse = require('csv-parse'),
    insertingCase,
    isUserSpecifiedFilesToInsert = false;

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

function CreateTable(createTableQuery, parsedData, tableName, insertRows, counter, connection) {
    connection.query(createTableQuery, error => {
        if (error) {
            console.error(error);
            return;
        }
        insertRows(tableName, parsedData, counter, connection);
    });
}

function insertRows(tableName, parsedData, counter, connection) {

    parsedData.forEach((row, index, array) => {
        let rowToInsert = [];
        for (let col in row) {
            rowToInsert.push(row[col]);
        }

        connection.query(`INSERT INTO ${tableName} VALUES (${rowToInsert.map(x => {
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

function readAndParseAndInsert(csvFiles, path, insertingCase, CreateTable, insertRows) {
    csvFiles.forEach(file => {
        fs.readFile(`${path}${file}`, "utf8", (error, csvFile) => {
            if (error) {
                console.error(error);
                return;
            }
            let tableName = convertFileNameToTableName(file);
            parse(csvFile, { columns: true }, (error, data) => {
                if (error) {
                    console.error(error);
                    return;
                }

                const colsName = Object.keys(data[0]);
                let createTableQuery = `CREATE TABLE ${tableName} (`;
                let connection = mysql.createConnection(DB_CONFIG);
                let completedQueryCount = 0;

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
                        CreateTable(createTableQuery, data, tableName, insertRows, completedQueryCount, connection);
                    });

                } else if (insertingCase === "--append") {

                    insertRows(tableName, data, completedQueryCount, connection);

                } else {

                    CreateTable(createTableQuery, data, tableName, insertRows, completedQueryCount, connection);

                }
            });
        });
    });
}

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
        readAndParseAndInsert(filesToInsert, "./", insertingCase, CreateTable, insertRows);
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

        readAndParseAndInsert(csvFiles, "./files/", insertingCase, CreateTable, insertRows);

    });
}
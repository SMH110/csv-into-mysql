let fs = require('fs'),
    mysql = require('mysql'),
    parse = require('csv-parse'),
    filesToInsert,
    insertingCase,
    isUserSpecifiedFilesToInsert = false;

const DB_CONFIG = require('./dbconfig.json');



// function makes any invalid csv's name valid
function convertFileNameToTableName(file) {
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





let args = process.argv;
let overwriteOrAppend = [];
filesToInsert = [];
for (let i = 2; i < args.length; i++) {
    if (args[i] === "--files") {
        isUserSpecifiedFilesToInsert = true;
    }
    if (args[i] === '--append' || args[i] === '--overwrite') {
        overwriteOrAppend.push(args[i]);
    }
    if (args[i].indexOf('.csv') > -1 && isUserSpecifiedFilesToInsert) {
        filesToInsert.push(args[i]);
    }
}

if (overwriteOrAppend.length) {
    insertingCase = overwriteOrAppend[overwriteOrAppend.length - 1];
}


if (isUserSpecifiedFilesToInsert) {

    filesToInsert = filesToInsert;
} else {
    filesToInsert = fs.readdirSync('./files/', 'utf8');
}

// Filter csv files
let csvFiles = filesToInsert.filter(file => /(\.csv)$/.test(file));
if (!csvFiles.length) {
    console.error(new Error('No CSV files found'));
    return;
}

// Loop on each csv file in order to insert it to mysql database

csvFiles.forEach(file => {
    let csvFile;
    if (isUserSpecifiedFilesToInsert) {
        csvFile = fs.readFileSync(`./${file}`, "utf8");
    } else {
        csvFile = fs.readFileSync(`./files/${file}`, "utf8");
    }


    let tableName = convertFileNameToTableName(file);


    parse(csvFile, { columns: true }, (error, data) => {
        if (error) {
            console.error(error);
            return;
        }

        const colsName = Object.keys(data[0]);
        let createTable = `CREATE TABLE ${tableName} (`;
        var connection = mysql.createConnection(DB_CONFIG);
        let completedQueryCount = 0;

        if (insertingCase !== "--append") {
            if (colsName.join().indexOf(" ") > -1 || colsName.join().indexOf("'") > -1 || colsName.join().indexOf('"') > -1) {
                for (let column of colsName) {

                    if (column.indexOf(" ") > -1 || column.indexOf("'") > -1 || column.indexOf('"') > -1) {
                        createTable += '`' + column + '`' + " TEXT, ";
                    } else {
                        createTable += column + " TEXT, ";
                    }
                }
                createTable = createTable.slice(0, -2) + ")";
            } else {
                createTable += colsName.join(" TEXT, ") + " TEXT)";
            }
        }
        if (insertingCase === "--overwrite") {

            connection.query(`SHOW TABLES LIKE '${tableName.slice(1, -1).replace(/'/g, "\\'")}'`, (error, result) => {
                if (error) {
                    console.error(error);
                    return;
                }
                if (result.length) {
                    connection.query(`DROP TABLE ` + tableName, error => {
                        if (error) {
                            console.error(error);
                            return;
                        }

                        CreateTable(createTable, data, tableName, insertRows, completedQueryCount, connection);

                    });
                } else {
                    CreateTable(createTable, data, tableName, insertRows, completedQueryCount, connection);
                }
            });

        } else if (insertingCase === "--append") {

            insertRows(tableName, data, completedQueryCount, connection);

        } else {

            CreateTable(createTable, data, tableName, insertRows, completedQueryCount, connection);

        }
    });
});

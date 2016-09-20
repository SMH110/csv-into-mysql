let fs = require('fs'),
    mysql = require('mysql'),
    parse = require('csv-parse'),
    filesToInsert,
    isUserSpecified = false;


const DB_CONFIG = require('./dbconfig.json');
// let connection = mysql.createConnection(DB_CONFIG);
// connection.query('SELECT * FROM `t1-root`', (error, data)=>{
//     connection.end();
//     if (error){
//         console.log(error);
//     }else{
//         console.log(data);
//     }
// })


// function makes any unvaild csv's name valid
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
            // Close the connection once all queries are complete
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

if (args.indexOf('--files') > 0) {
    isUserSpecified = true;
    filesToInsert = args.slice(args.indexOf('--files') + 1);
    let notfoundFile = [];
    filesToInsert.forEach(file => {
        try {
            fs.statSync(`./${file}`);
        } catch (error) {
            console.error(new Error(`${file} not found!`));
            notfoundFile.push(file);
        }
    });

    // select files which user specified and they was found; to Insert found files and to not get error 
    if (notfoundFile.length) {
        filesToInsert = filesToInsert.filter(file => notfoundFile.indexOf(file) < 0);
    }

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
    if (isUserSpecified) {
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

        if (args[2] !== "--append") {
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

        if (args[2] === "--overwrite") {

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

        } else if (args[2] === "--append") {

            insertRows(tableName, data, completedQueryCount, connection);

        } else {

            CreateTable(createTable, data, tableName, insertRows, completedQueryCount, connection);

        }
    });
});

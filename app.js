let fs = require('fs'),
    mysql = require('promise-mysql'),
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
    if (file.indexOf("`") > -1) {
        file = file.replace(/`/g, "``");
    }

    return file.indexOf(".csv") > -1 || file.indexOf(".txt") > -1 ? `\`${file.slice(0, -4)}\`` : `\`${file}\``;
}

function escape(string) {
    if (string.indexOf("`") > -1) {
        string = string.replace(/`/g, "``")
    }

    if (string.indexOf('"') > -1 || string.indexOf("'") > -1 || string.indexOf(" ") > -1) {
        string = `\`${string}\``
    }

    return string
}

function escapeRows(string) {
    string = string.replace(/"/g, '""');
    return `"${string}"`
}


function createTable(tableName, columns, parsedData, connection) {

    return connection.query(`CREATE TABLE ${tableName} (${columns.map(x => `${escape(x)} TEXT`).join()})`)
        .catch(console.error)
        .then(() => insertRows(tableName, parsedData, connection));
}

function insertRows(tableName, parsedData, connection) {
    return Promise.all(
        // Could have backticks inside values... =============================================>    YES THAT IS NOT PROBLEM; THERE IS A TEST FRO THAT.

        parsedData.map(row => {
            var sql = `INSERT INTO ${tableName} VALUES (${row.map(x => escapeRows(x)).join()})`;
            connection.query(sql);
        })
    )
        .catch(console.error)
        .then(() => connection.end());
}

function readAndParseAndInsert(csvFiles, path, insertingCase) {
    csvFiles.forEach(file => {
        console.log(`${path}${file}`);
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

                const columns = data[0];
                mysql.createConnection(DB_CONFIG)
                    .then(connection => {
                        if (insertingCase === "--overwrite") {
                            connection.query(`DROP TABLE IF EXISTS ${(tableName)}`)
                                .catch(console.error)
                                .then(() => createTable(tableName, columns, data.slice(1), connection));
                        } else if (insertingCase === "--append") {
                            insertRows(tableName, data.slice(1), connection);
                        } else {
                            createTable(tableName, columns, data.slice(1), connection);
                        }
                    });
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
    if ((args[i] !== "--append" && args[i] !== "--overwrite" && args[i] !== "--files") && isUserSpecifiedFilesToInsert) {
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
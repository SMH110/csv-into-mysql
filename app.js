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

// TODO - refactor this (and the 2 functions above)
function readAndParse(file, path, isToXML) {
    return new Promise((resolve, reject) => {
        fs.readFile(`${path}${file}`, 'utf-8', (error, csvFile) => {
            if (error) {
                reject(error);
            } else {
                parse(csvFile, isToXML ? { columns: true } : null, (error, data) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(data);
                    }
                })
            }
        })
    })
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

                const columns = data[0];
                mysql.createConnection(DB_CONFIG)
                    .then(connection => {
                        if (insertingCase === "--overwrite") {
                            connection.query(`DROP TABLE IF EXISTS ${(tableName)}`)
                                .catch(error => {
                                    console.error(error);
                                    connection.end();
                                    throw error;
                                })
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

function writetoXmlFile(parsedData, newXmlFileName) {
    fs.open(`./files/xml/${newXmlFileName}.xml`, "w", (error) => {
        if (error) {
            console.error(error);
            return;
        }

        let columns = parsedData[0];
        console.log(columns);
        let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
        <data>
        `;
        for (let i = 1; i < parsedData.length; i++) {
            for (let j = 0; j < parsedData[i].length; j++) {
                console.log(columns[j]);
                xmlContent += `<${newXmlFileName}>
                <${columns[j]}><${parsedData[i][j]}></${columns[j]}>
                 </${newXmlFileName}>`
            }
        }

        xmlContent += `</data>`

        fs.writeFile(`./files/xml/${newXmlFileName}.xml`, xmlContent, (error) => {
            if (error) {
                console.error(error);
                return;
            }
        })
    })
}
let insertingCase,
    isUserSpecifiedFilesToInsert = false,
    isToXML = false;

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

    if (args[i] === "--output=xml") {
        isToXML = true;
    }
}


if (!isToXML) {
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
} else {

}



fs.readFile(`files/t2.csv`, "utf8", (error, csvFile) => {
    if (error) {
        console.error(error);
        return;
    }
    let tableName = convertFileNameToTableName("t2.csv");
    parse(csvFile, (error, data) => {
        if (error) {
            console.error(error);
            return;
        }

        writetoXmlFile(data, tableName)
    });
})
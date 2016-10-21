const fs = require('fs'),
    mysql = require('promise-mysql'),
    parse = require('csv-parse'),
    objectToXml = require('object-to-xml'),
    path = require('path');


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
function readAndParse(filePath, file, isToXML) {
    return new Promise((resolve, reject) => {
        fs.readFile(`${filePath}${file}`, 'utf-8', (error, csvFile) => {
            console.log("");
            console.log("-------->  READING FILE  ", `${filePath}${file}`);
            console.log("");
            if (error) {
                console.log("");
                console.log("--------------!!!  ERROR WHILE READING THE FILE  !!!-------------");
                console.log("");
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

function insertCsvIntoMysql(csvFiles, filePath, insertingCase) {
    csvFiles.forEach(file => {
        readAndParse(filePath, file, false)
            .then(data => {
                let tableName = convertFileNameToTableName(file);
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
            })
    });
}

function createXmlFile(pathToXML, fileName, option) {
    return new Promise((resolve, reject) => {
        fs.open(`${pathToXML}${fileName}`, option, (error) => {
            if (error) {
                console.log("");
                console.log("--------------!!!  ERROR WHILE CREATING THE FILE  !!!-------------");
                console.log("");
                reject(error);
            } else {
                resolve();
            }
        })
    })
}

function prepareXmlToOutput(arrayData, fileName) {
    let object = { '?xml version="1.0" encoding="UTF-8"?': null, 'data': {} };
    object[fileName] = arrayData

    return objectToXml(object).replace(/<\/data>/, "").replace(/^\s*\n/m, "") + "</data>";
}

function writeToXmlFile(path, fileName, xmlData) {
    return new Promise((resolve, reject) => {

        fs.writeFile(`${path}${fileName}`, xmlData, (error) => {
            if (error) {
                console.log("");
                console.log("--------------!!!  ERROR WHILE WRITING TO THE FILE  !!!-------------");
                console.log("");
                reject(error);
            } else {
                resolve();
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
    if ((args[i] !== "--append" && args[i] !== "--overwrite" && args[i] !== "--files" && args[i] !== "--output=xml") && isUserSpecifiedFilesToInsert) {
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
            insertCsvIntoMysql(filesToInsert, "./", insertingCase);
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

            insertCsvIntoMysql(csvFiles, "./files/", insertingCase);

        });
    }
} else {
    if (isUserSpecifiedFilesToInsert) {
        if (filesToInsert.length) {
            filesToInsert.forEach(file => {
                let filePath = path.parse(file);
                filePath.dir = filePath.dir === "" ? "." : filePath.dir;
                createXmlFile(`${filePath.dir}/`, `${filePath.name}.xml`, "w")
                    .then(() => {
                        readAndParse(`${filePath.dir}/`, `${filePath.base}`, true)
                            .then(data => prepareXmlToOutput(data, filePath.name))
                            .then((obj) => {
                                console.log(obj);
                                writeToXmlFile(`${filePath.dir}/`, `${filePath.name}.xml`, obj)
                            })
                            .catch(error => console.error(error))
                    })
            })
        } else {
            console.error(new Error('No CSV or TXT files specified'));
        }
    } else {



    }

}

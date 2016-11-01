const fs = require('fs'),
    path = require('path'),
    objectToXml = require('object-to-xml');

function checkIfFileExists(path, option) {
    return new Promise((resolve, reject) => {
        fs.open(path, option, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve(error);
            }
        });
    });
}

function prepareXmlToOutput(arrayData, fileName) {
    let counter = 0;
    for (let obj of arrayData) {
        for (let prop in obj) {
            if (/[^:A-Za-z_\.0-9-]+/.test(prop)) {
                obj[prop.replace(/[^:A-Za-z_\.0-9-]+/g, "")] = obj[prop];
                delete obj[prop];
            }
        }
    }

    // Another loop to insure that there is no invalid character at the beginning of the column name
    for (let i = 0; i < arrayData.length; i++) {
        for (let prop in arrayData[i]) {
            if (/[^:|A-Z|a-z|_]/.test(prop[0])) {
                let newPropertyName = prop.slice(1);
                let noLengthAfterSlicingInvalidChar = false;
                if (!newPropertyName.length) {
                    newPropertyName = "AutoColumnName_" + counter;
                    for (let j = i + 1; j < arrayData.length; j++) {
                        for (let prop2 in arrayData[j]) {
                            if (prop2 === prop) {
                                arrayData[j][newPropertyName] = arrayData[j][prop2];
                                delete arrayData[j][prop2];
                            }
                        }
                    }
                    noLengthAfterSlicingInvalidChar = true
                    arrayData[i][newPropertyName] = arrayData[i][prop];
                    delete arrayData[i][prop];
                    counter++;
                }

                if (!noLengthAfterSlicingInvalidChar) {
                    arrayData[i][newPropertyName] = arrayData[i][prop];
                    delete arrayData[i][prop];
                }
            }
        }
    }

    let object = { '?xml version="1.0" encoding="UTF-8"?': null, 'data': {} };
    object[fileName] = arrayData;

    return objectToXml(object).replace(/<\/data>/, "").replace(/^\s*\n/m, "") + "</data>";
}

function writeToXmlFile(path, xmlData) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, xmlData, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            };
        });
    });
}

function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf-8', (error, fileData) => {
            if (error) {
                reject(error);

            } else {
                resolve(fileData);
            }
        });
    });
}

function writer(filePath, csvData, insertingCase) {
    let parsedPath = path.parse(filePath),
        xmlData = prepareXmlToOutput(csvData, parsedPath.name);
    if (insertingCase === "--overwrite") {
        return writeToXmlFile(`${parsedPath.dir}/${parsedPath.name}.xml`, xmlData);
    } else if (insertingCase === "--append") {
        return readFile(`${parsedPath.dir}/${parsedPath.name}.xml`)
            .then(oldXmlData => {
                oldXmlData = oldXmlData.split(/\r?\n/).slice(0, -1);
                xmlData = xmlData.split(/\r?\n/).slice(2);
                let newXmlData = oldXmlData.concat(xmlData).join("\r\n");
                return newXmlData;
            }).then((newXmlData) => {
                writeToXmlFile(`${parsedPath.dir}/${parsedPath.name}.xml`, newXmlData)
            })
    } else {
        return checkIfFileExists(`${parsedPath.dir}/${parsedPath.name}.xml`, "wx")
            .then(() => {
                writeToXmlFile(`${parsedPath.dir}/${parsedPath.name}.xml`, xmlData)
            }).catch(error => {
                if (error.code === "EEXIST") {
                    console.error(new Error(`${parsedPath.base} is already exists; use --overwrite to overwrite ${parsedPath.base}, or --append to append to ${parsedPath.base}`));
                }
            });
    }
}


module.exports = {
    writer
}
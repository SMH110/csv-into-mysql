const fs = require('fs'),
    parse = require('csv-parse')

module.exports = function (path, output) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf-8', (error, csvFile) => {
            if (error) {
                reject(error);
            } else {
                parse(csvFile, output === "xml" ? { columns: true } : null, (error, data) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(data);
                    }
                });
            }
        });
    });
}
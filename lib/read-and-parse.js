const fs = require('fs'),
    parse = require('csv-parse')

module.exports = function (path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf-8', (error, csvFile) => {
            if (error) {
                reject(error);
            } else {
                parse(csvFile, { columns: true }, (error, data) => {
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
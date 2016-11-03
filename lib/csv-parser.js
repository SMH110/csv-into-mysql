const parse = require('csv-parse');

module.exports = function(csvFile) {
    return new Promise((resolve, reject) => {
        parse(csvFile, { columns: true }, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}
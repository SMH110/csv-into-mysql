const fs = require('fs');

module.exports = function(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf-8', (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data)
            }
        });
    });
}
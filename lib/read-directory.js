const fs = require('fs');
module.exports = function (path) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (error, dir) => {
            if (error) {
                reject(error);
            } else {
                resolve(dir);
            }
        });
    });
}
module.exports = function runCommand(command) {
    return new Promise((resolve, reject) => {
        let child = require('child_process').exec(command, error => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
        child.stdout.on('data', console.log);
        child.stderr.on('data', console.error);
    });
};
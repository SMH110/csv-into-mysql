const fs = require('fs'),
    mysql = require('mysql'),
    parse = require('csv-parse'),
    expect = require('chai').expect,
    DB_CONFIG = require('../dbconfig.json'),
    sinon = require('sinon');

var exec = exec;



// describe('When the user puts csv files in the files folder', function () {

//     describe('And runs the app.js from the command line', function () {
//         beforeEach(function () {

//             runProcess('node app.js --overwrite');
//         });


//         it('should do what...', function () {
//             expect("SMH").to.be.equal("SMH");
//         });
//     });



// });






function runProcess(command) {
    return new Promise((resolve, reject) => {
        require('child_process').exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }

            if (stdout.on) {
                stdout.on('data', console.log);
            } else {
                console.log(stdout);
            }

            var errors = [];

            if (stderr.on) {
                stderr.on('data', data => errors.push(data));
                stderr.on('close', errors.length ? reject(errors) : resolve());
            } else {
                reject(stderr);
            }
        });
    });
}


function deleteTableIfExist() {
    fs.readdir('../files', 'utf8', (error, files) => {
        if (error) {
            console.error(error);
            return;
        }

        files.forEach((file, index) => {
            let tableName = convertFileNameToTableName(file);
            let connection = mysql.createConnection(DB_CONFIG);
            connection.query(`DROP TABLE IF EXISTS ${tableName}`, (error, result) => {
                if (error) {
                    console.error(error);
                    return;
                }

                console.log(result);
                if (files.length === ++index) {
                    connection.end();
                }
            });

        });
    });
}

deleteTableIfExist();

function convertFileNameToTableName(file) {
    file = file.slice(0, -4).replace(/`/g, "``");
    return "`" + file + "`";
}
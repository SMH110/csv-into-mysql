const fs = require('fs'),
    mysql = require('mysql'),
    parse = require('csv-parse'),
    expect = require('chai').expect,
    DB_CONFIG = require('../dbconfig.json'),
    sinon = require('sinon');

var exec = exec;



// describe('When the user puts csv files in the files folder', function () {
//     this.timeout(5000);

//     describe('And runs the app.js from the command line', function () {
//         beforeEach(function () {
//             deleteTableIfExist();
//             return runProcess('node app.js');
//         });


//         afterEach(function () {
//             deleteTableIfExist();
//         });


//         it('should do what...', function () {
//             expect("SMH").to.be.equal("SMH");
//         });
//     });
// });
 deleteTableIfExist();

function runProcess(command) {
    return new Promise((resolve, reject) => {
        require('child_process').exec(command, (error, stdout, stderr) => {
            if (error) {
                return void reject(error);
            }
            if (stdout) {
                console.log(stdout);
            }
            if (stderr) {
                return void reject(stderr);
            }
            return void resolve();
        });
    });
}


function deleteTableIfExist() {

    console.log("deleteTableIfExist have been run :)");
    fs.readdir('../files', 'utf8', (error, files) => {
        if (error) {
            console.error(error);
            return;
        }
        let connection = mysql.createConnection(DB_CONFIG);
        files.forEach((file, index) => {
            let tableName = convertFileNameToTableName(file);

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



function convertFileNameToTableName(file) {
    file = file.slice(0, -4).replace(/`/g, "``");
    return "`" + file + "`";
}



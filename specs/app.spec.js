const fs = require('fs'),
    mysql = require('mysql'),
    parse = require('csv-parse'),
    expect = require('chai').expect,
    DB_CONFIG = require('../dbconfig.json'),
    sinon = require('sinon');

describe('When the user has some csv or txt files to insert', function () {
    this.timeout(10000);

    beforeEach(function () {
        return ensureTablesRemoved([
            't1', 't2', 'tr', 'path_test', 'transactions',
            'users', 'countries', 'test1', 'test2'
        ]);
    });

    afterEach(function () {
        return ensureTablesRemoved([
            't1', 't2', 'tr', 'path_test', 'transactions',
            'users', 'countries', 'test1', 'test2'
        ]);
    });

    describe('When the user has some csv files in the files folder and runs the app.js from the command line with no options', function () {
        beforeEach(() => {
            return runCommand('node app.js');
        });

        it('Should complete without error', function () {
        });

        it('Should have inserted the t1 csv as expected', function () {
            return connectAndQuery('SELECT * FROM t1')
                .then(data => {
                    expect(data).to.deep.equal([
                        { '"id"': "1", 'first name': '"SMH"', "person's email": 'smh@email.com' },
                        { '"id"': "2", 'first name': "MO'", "person's email": 'mo@email.com' },
                        { '"id"': "3", 'first name': 'hello, world', "person's email": 'someemail@email.com' }
                    ]);

                });
        });

        it('Should have inserted the t2 csv as expected', function () {
            return connectAndQuery('SELECT * FROM t2')
                .then(data => {
                    expect(data).to.deep.equal([
                        { 'COL1': '"Hello, World!"', 'COL2': '```' }
                    ]);

                });
        });
    });

    describe('When the user runs app.js using the --files flag', function () {

        beforeEach(function () {
            return runCommand('node app.js --files tr.csv');
        });

        it('Should have inserted the tr csv as expected', function () {

            return connectAndQuery('SELECT * FROM tr')
                .then(data => {
                    expect(data).to.deep.equal([
                        { '"id"': '1', 'first name': '"SMH"', 'person\'s email': 'smh@email.com' },
                        { '"id"': '2', 'first name': 'MO\'', 'person\'s email': 'mo@email.com' },
                        { '"id"': '3', 'first name': 'hello, world', 'person\'s email': 'someemail@email.com' },
                        { '"id"': '4', 'first name': 'john', 'person\'s email': 'john@email.com' }
                    ]);
                });
        });

        it('Should have not inserted t1 csv in the files folder', function () {

            return connectAndQuery('SHOW TABLES LIKE \'t1\'')
                .then(data => {
                    expect(data.length).to.equal(0);
                });
        });

        it('Should have not inserted t2 csv in the files folder', function () {

            return connectAndQuery('SHOW TABLES LIKE \'t2\'')
                .then(data => {
                    expect(data.length).to.equal(0);
                });
        });
    });


    describe('When the user use the --files flag followed by path to csv file', function () {
        beforeEach(function () {
            return runCommand('node app.js --files specs/data/path_test.csv');
        });

        it('Should have inserted the path_test as expected', function () {
            return connectAndQuery('SELECT * FROM `path_test`')
                .then(data => {
                    expect(data).to.deep.equal([
                        { 'id': '1', 'test type': 'test node app.js --files spec/data/path_test.csv' }
                    ]);
                });
        });

        it('Should have extracted the file name from the path', function () {
            return connectAndQuery(`SHOW TABLES LIKE 'path_test'`)
                .then(table => {
                    expect(table.length).to.not.be.empty;
                });
        });
    });

    describe('When the user use the flag --append', function () {
        beforeEach(function () {
            return runCommand('node app.js')
                .then(() => runCommand('node app.js --append'));
        });

        it('Should have appended the t1 csv as expected', function () {
            return connectAndQuery('SELECT * FROM t1')
                .then(data => {
                    expect(data).to.deep.equal([
                        { '"id"': '1', 'first name': '"SMH"', 'person\'s email': 'smh@email.com' },
                        { '"id"': '2', 'first name': 'MO\'', 'person\'s email': 'mo@email.com' },
                        { '"id"': '3', 'first name': 'hello, world', 'person\'s email': 'someemail@email.com' },
                        { '"id"': '1', 'first name': '"SMH"', 'person\'s email': 'smh@email.com' },
                        { '"id"': '2', 'first name': 'MO\'', 'person\'s email': 'mo@email.com' },
                        { '"id"': '3', 'first name': 'hello, world', 'person\'s email': 'someemail@email.com' }
                    ]);
                });
        });

        it('Should have appended the t2 csv as expected', function () {
            return connectAndQuery('SELECT * FROM t2')
                .then(data => {
                    expect(data).to.deep.equal([
                        { 'COL1': '"Hello, World!"', 'COL2': '```' },
                        { 'COL1': '"Hello, World!"', 'COL2': '```' }
                    ]);
                });
        });
    });

    describe('When the user runs the app.js using the flag --overwrite', function () {
        beforeEach(function () {
            return runCommand('node app.js')
                .then(() => runCommand('node app.js --overwrite --files t1.csv'));
        });


        it('Should have overwritten t1 as expected', function () {
            return connectAndQuery('SELECT * FROM t1')
                .then(data => {
                    expect(data).to.deep.equal([
                        { '"id"': '1', 'first name': '"SMH"', 'person\'s email': 'smh@email.com' },
                        { '"id"': '2', 'first name': 'MO\'', 'person\'s email': 'mo@email.com' },
                        { '"id"': '3', 'first name': 'hello, world', 'person\'s email': 'someemail@email.com' },
                        { '"id"': '4', 'first name': 'john', 'person\'s email': 'john@email.com' }
                    ]);
                });
        });
    });


    describe('When the user user the --append flag before --files flag', function () {
        beforeEach(function () {
            return runCommand('node app.js --files specs/data/append/jan/transactions.csv')
                .then(() => runCommand('node app.js --append --files specs/data/append/feb/transactions.csv'));
        });

        it('Should have appended the data as expected', function () {
            return connectAndQuery('SELECT * FROM transactions')
                .then(data => {
                    expect(data).to.deep.equal([
                        { 'id': '1', 'Command': 'node app.js  --files specs/data/append/jan/transactions.csv' },
                        { 'id': '2', 'Command': 'node app.js --append --files specs/data/append/feb/transactions.csv' },
                        { 'id': '3', 'Command': 'I have been appended' }]);
                });
        });
    });


    describe('When the user uses the --append flag after --files flag', function () {
        beforeEach(function () {
            return runCommand('node app.js --files specs/data/append/jan/transactions.csv')
                .then(() => runCommand('node app.js --files specs/data/append/feb/transactions.csv --append'));
        });

        it('Should have appended the data as expected', function () {
            return connectAndQuery('SELECT * FROM transactions')
                .then(data => {
                    expect(data).to.deep.equal([
                        { 'id': '1', 'Command': 'node app.js  --files specs/data/append/jan/transactions.csv' },
                        { 'id': '2', 'Command': 'node app.js --append --files specs/data/append/feb/transactions.csv' },
                        { 'id': '3', 'Command': 'I have been appended' }]);
                });
        });
    });

    describe('When the user uses the --overwrite flag before the --files flag', function () {
        beforeEach(function () {
            return runCommand('node app.js --files specs/data/overwrite/march/users.csv')
                .then(() => runCommand('node app.js --overwrite --files specs/data/overwrite/april/users.csv'));
        });

        it('Should have overwritten the table as expected', function () {
            return connectAndQuery('SELECT * FROM users')
                .then(data => {
                    expect(data).to.deep.equal([
                        { 'id': '1', 'test type': 'node app.js  --files specs/data/overwrite/march/users.csv' },
                        { 'id': '2', 'test type': 'node app.js --overwrite --files specs/data/overwrite/april/users.csv' },
                        { 'id': '3', 'test type': 'I have been overwritten ' }]);
                });
        });
    });

    describe('When the user uses the --overwrite flag after the --files flag', function () {
        beforeEach(function () {
            return runCommand('node app.js --files specs/data/overwrite/march/users.csv')
                .then(() => runCommand('node app.js --files specs/data/overwrite/april/users.csv --overwrite'));
        });

        it('Should have overwritten the table as expected', function () {
            return connectAndQuery('SELECT * FROM users')
                .then(data => {
                    expect(data).to.deep.equal([
                        { 'id': '1', 'test type': 'node app.js  --files specs/data/overwrite/march/users.csv' },
                        { 'id': '2', 'test type': 'node app.js --overwrite --files specs/data/overwrite/april/users.csv' },
                        { 'id': '3', 'test type': 'I have been overwritten ' }]);
                });
        });
    });

    describe('When the user specify a txt file to be inserted', function () {

        beforeEach(function () {
            return runCommand('node app.js --files specs/data/text_file/countries.txt');
        });

        it('Should have been inserted the countries file as expected', function () {
            return connectAndQuery('SELECT * FROM countries')
                .then(data => {
                    expect(data).to.deep.equal([
                        { 'COUNTRY': 'Australia', 'ISO CODES': '61' },
                        { 'COUNTRY': 'Bengaldesh', 'ISO CODES': '880' }
                    ]);
                });
        });

    });

    describe('When the user specify one or more csv files to be inserted', function () {
        beforeEach(function () {
            return runCommand('node app.js --files specs/data/csv_files/test1.csv specs/data/csv_files/test2.csv');
        });

        it('Should have inserted test1 as expected', function () {
            return connectAndQuery('SELECT * FROM test1')
                .then(data => {
                    expect(data).to.deep.equal([{ 'id': '1', 'Name': 'test 1' }]);
                });
        });

        it('Should have inserted test2 as expected', function () {
            return connectAndQuery('SELECT * FROM test2')
                .then(data => {
                    expect(data).to.deep.equal([{ 'id': '1', 'Name': 'test 2' }]);
                });
        });
    });

});





function runCommand(command) {
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

function ensureTablesRemoved(tables) {
    return new Promise((resolve, reject) => {
        let connection = mysql.createConnection(DB_CONFIG);

        var numberOfTablesProcessed = 0;
        tables.forEach(table => {
            connection.query(`DROP TABLE IF EXISTS \`${table}\``, error => {
                numberOfTablesProcessed++;

                if (error) {
                    reject(error);
                }

                if (numberOfTablesProcessed === tables.length) {
                    connection.end();
                    resolve();
                }
            });
        });
    });
}


function connectAndQuery(query) {
    return new Promise((resolve, reject) => {
        let connection = mysql.createConnection(DB_CONFIG);
        connection.query(query, (error, data) => {
            connection.end();
            if (error) {
                return void reject(error);
            }
            resolve(data);
        });
    });
}


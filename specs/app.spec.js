const fs = require('fs'),
    mysql = require('mysql'),
    parse = require('csv-parse'),
    expect = require('chai').expect,
    DB_CONFIG = require('../dbconfig.json'),
    sinon = require('sinon');

describe('When the user has csv files in the files folder', function () {
    this.timeout(10000);

    beforeEach(function () {
        return ensureTablesRemoved(['t1', 't2', 'tr']);
    });

    afterEach(function () {
        return ensureTablesRemoved(['t1', 't2', 'tr']);
    });

    describe('And runs the app.js from the command line with no options', function () {
        beforeEach(() => {
            return runCommand('node app.js');
        });

        it('Should complete without error', function () {
        });

        it('Should have inserted the t1 csv as expected', function (done) {
            connectAndQuery('SELECT * FROM t1')
                .then(data => {
                    expect(data).to.deep.equal([
                        { '"id"': "1", 'first name': '"SMH"', "person's email": 'smh@email.com' },
                        { '"id"': "2", 'first name': "MO'", "person's email": 'mo@email.com' },
                        { '"id"': "3", 'first name': 'hello, world', "person's email": 'someemail@email.com' }
                    ]);
                    done();
                });
        });

        it('Should have inserted the t2 csv as expected', function (done) {
            connectAndQuery('SELECT * FROM t2')
                .then(data => {
                    expect(data).to.deep.equal([
                        { 'COL1': '"Hello, World!"', 'COL2': '```' }
                    ]);
                    done();
                });
        });
    });

    describe('When the user runs app.js using the --files flag', function () {

        beforeEach(function () {
            return runCommand('node app.js --files tr.csv');
        });

        it('Should have inserted the tr csv as expected', function (done) {

            connectAndQuery('SELECT * FROM tr')
                .then(data => {
                    expect(data).to.deep.equal([
                        { '"id"': '1', 'first name': '"SMH"', 'person\'s email': 'smh@email.com' },
                        { '"id"': '2', 'first name': 'MO\'', 'person\'s email': 'mo@email.com' },
                        { '"id"': '3', 'first name': 'hello, world', 'person\'s email': 'someemail@email.com' },
                        { '"id"': '4', 'first name': 'john', 'person\'s email': 'john@email.com' }
                    ]);
                    done();
                });
        });

        it('Should have not inserted t1 csv in the files folder', function (done) {

            connectAndQuery('SHOW TABLES LIKE \'t1\'')
                .then(data => {
                    expect(data.length).to.deep.equal(0);
                    done();
                });
        });

        it('Should have not inserted t2 csv in the files folder', function (done) {

            connectAndQuery('SHOW TABLES LIKE \'t2\'')
                .then(data => {
                    expect(data.length).to.deep.equal(0);
                    done();
                });
        });
    });

    describe('When the user use the flag --append', function () {
        beforeEach(function () {
            return runCommand('node app.js');
        });

        beforeEach(function () {
            return runCommand('node app.js --append');
        });

        it('Should have appended the t1 csv as expected', function (done) {
            connectAndQuery('SELECT * FROM t1')
                .then(data => {
                    expect(data).to.deep.equal([
                        { '"id"': '1', 'first name': '"SMH"', 'person\'s email': 'smh@email.com' },
                        { '"id"': '2', 'first name': 'MO\'', 'person\'s email': 'mo@email.com' },
                        { '"id"': '3', 'first name': 'hello, world', 'person\'s email': 'someemail@email.com' },
                        { '"id"': '1', 'first name': '"SMH"', 'person\'s email': 'smh@email.com' },
                        { '"id"': '2', 'first name': 'MO\'', 'person\'s email': 'mo@email.com' },
                        { '"id"': '3', 'first name': 'hello, world', 'person\'s email': 'someemail@email.com' }
                    ]);
                    done();
                });
        });

        it('Should have appended the t2 csv as expected', function (done) {
            connectAndQuery('SELECT * FROM t2')
                .then(data => {
                    expect(data).to.deep.equal([
                        { COL1: '"Hello, World!"', COL2: '```' },
                        { COL1: '"Hello, World!"', COL2: '```' }
                    ]);
                    done();
                });
        });
    });

    describe('When the user runs the app.js using the flag --overwrite', function () {
        beforeEach(function () {
            return runCommand('node app.js');
        });

        beforeEach(function () {
            return runCommand('node app.js --overwrite --files t1.csv');
        });

        it('Should have overwritten t1 as expected', function (done) {
            connectAndQuery('SELECT * FROM t1')
                .then(data => {
                    expect(data).to.deep.equal([
                        { '"id"': '1', 'first name': '"SMH"', 'person\'s email': 'smh@email.com' },
                        { '"id"': '2', 'first name': 'MO\'', 'person\'s email': 'mo@email.com' },
                        { '"id"': '3', 'first name': 'hello, world', 'person\'s email': 'someemail@email.com' },
                        { '"id"': '4', 'first name': 'john', 'person\'s email': 'john@email.com' }
                    ]);
                    done();
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
            connection.query(`DROP TABLE IF EXISTS ${table}`, error => {
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


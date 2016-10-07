const mysql = require('promise-mysql'),
    expect = require('chai').expect,
    DB_CONFIG = require('../dbconfig.json');


describe('When the user has some csv or txt files to insert', function () {
    this.timeout(1000);

    beforeEach(function () {
        return ensureTablesRemoved([
            't1', 't2', 'tr', 'test1', 'test2']

        );
    });

    afterEach(function () {
        return ensureTablesRemoved([
            't1', 't2', 'tr', 'test1', 'test2']

        );
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
                        { COL1: '"Hello, World!"', COL2: '```' }
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
            return ensureTablesRemoved(['names'])
                .then(() => {
                    return runCommand('node app.js --files specs/data/path_test/names.csv');
                });
        });

        afterEach(function () {
            return ensureTablesRemoved(['names']);
        });

        it('Should have inserted the path_test as expected', function () {
            return connectAndQuery('SELECT * FROM names')
                .then(data => {
                    expect(data).to.deep.equal([{ id: '1', name: 'Sam Pauline' },
                    { id: '2', name: 'Kristen Cumberbatch' },
                    { id: '3', name: 'Roy Borne' }]);
                });
        });

        it('Should have extracted the file name from the path', function () {
            return connectAndQuery(`SHOW TABLES LIKE 'names'`)
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
            return ensureTablesRemoved(['people'])
                .then(() => {
                    return runCommand('node app.js --files specs/data/append/jan/people.csv')
                        .then(() => runCommand('node app.js --append --files specs/data/append/feb/people.csv'));
                });
        });

        afterEach(function () {
            return ensureTablesRemoved(['people']);
        });

        it('Should have appended the data as expected', function () {
            return connectAndQuery('SELECT * FROM people')
                .then(data => {
                    expect(data).to.deep.equal([{
                        id: '1',
                        first_name: 'Roy',
                        last_name: 'Howell',
                        email: 'rhowell0@simplemachines.org',
                        gender: 'Male',
                        ip_address: '138.0.91.197'
                    },
                    {
                        id: '2',
                        first_name: 'Teresa',
                        last_name: 'Austin',
                        email: 'taustin1@bbc.co.uk',
                        gender: 'Female',
                        ip_address: '104.140.233.171'
                    },
                    {
                        id: '3',
                        first_name: 'Jacqueline',
                        last_name: 'Anderson',
                        email: 'janderson2@technorati.com',
                        gender: 'Female',
                        ip_address: '215.44.38.175'
                    },
                    {
                        id: '4',
                        first_name: 'Arthur',
                        last_name: 'Perry',
                        email: 'aperry3@livejournal.com',
                        gender: 'Male',
                        ip_address: '236.67.203.238'
                    },
                    {
                        id: '5',
                        first_name: 'Carolyn',
                        last_name: 'Gray',
                        email: 'cgray4@nature.com',
                        gender: 'Female',
                        ip_address: '133.169.61.89'
                    },
                    {
                        id: '6',
                        first_name: 'Mat',
                        last_name: 'jackson',
                        email: 'mmjj@hotmail.com',
                        gender: 'Male',
                        ip_address: '129.168.1.11'
                    },
                    {
                        id: '7',
                        first_name: 'Hope',
                        last_name: 'Kate',
                        email: 'hope222@hotmail.com',
                        gender: 'Female',
                        ip_address: '233.55.66.1'
                    }]);
                });
        });
    });

    describe('When the user uses the --append flag after --files flag', function () {
        beforeEach(function () {
            return ensureTablesRemoved(['people'])
                .then(() => {
                    return runCommand('node app.js --files specs/data/append/jan/people.csv')
                        .then(() => runCommand('node app.js --files specs/data/append/feb/people.csv --append'));
                });
        });

        afterEach(function () {
            return ensureTablesRemoved(['people']);
        });

        it('Should have appended the data as expected', function () {
            return connectAndQuery('SELECT * FROM people')
                .then(data => {
                    expect(data).to.deep.equal([{
                        id: '1',
                        first_name: 'Roy',
                        last_name: 'Howell',
                        email: 'rhowell0@simplemachines.org',
                        gender: 'Male',
                        ip_address: '138.0.91.197'
                    },
                    {
                        id: '2',
                        first_name: 'Teresa',
                        last_name: 'Austin',
                        email: 'taustin1@bbc.co.uk',
                        gender: 'Female',
                        ip_address: '104.140.233.171'
                    },
                    {
                        id: '3',
                        first_name: 'Jacqueline',
                        last_name: 'Anderson',
                        email: 'janderson2@technorati.com',
                        gender: 'Female',
                        ip_address: '215.44.38.175'
                    },
                    {
                        id: '4',
                        first_name: 'Arthur',
                        last_name: 'Perry',
                        email: 'aperry3@livejournal.com',
                        gender: 'Male',
                        ip_address: '236.67.203.238'
                    },
                    {
                        id: '5',
                        first_name: 'Carolyn',
                        last_name: 'Gray',
                        email: 'cgray4@nature.com',
                        gender: 'Female',
                        ip_address: '133.169.61.89'
                    },
                    {
                        id: '6',
                        first_name: 'Mat',
                        last_name: 'jackson',
                        email: 'mmjj@hotmail.com',
                        gender: 'Male',
                        ip_address: '129.168.1.11'
                    },
                    {
                        id: '7',
                        first_name: 'Hope',
                        last_name: 'Kate',
                        email: 'hope222@hotmail.com',
                        gender: 'Female',
                        ip_address: '233.55.66.1'
                    }]);
                });
        });
    });

    describe('When the user uses the --overwrite flag before the --files flag', function () {

        beforeEach(function () {
            return ensureTablesRemoved(['languages'])
                .then(() => {
                    return runCommand('node app.js --files specs/data/overwrite/march/languages.csv')
                        .then(() => runCommand('node app.js --overwrite --files specs/data/overwrite/april/languages.csv'));
                });
        });

        afterEach(function () {
            return ensureTablesRemoved(['languages']);
        });

        it('Should have overwritten the table as expected', function () {
            return connectAndQuery('SELECT * FROM languages')
                .then(data => {
                    expect(data).to.deep.equal([
                        { ID: '1', 'LANGAUGE NAME': 'French', 'ISO 639-3': ' fra' },
                        { ID: '2', 'LANGAUGE NAME': ' Hindi', 'ISO 639-3': ' hin' }
                    ]);
                });
        });
    });

    describe('When the user uses the --overwrite flag after the --files flag', function () {

        beforeEach(function () {
            return ensureTablesRemoved(['languages'])
                .then(() => {
                    return runCommand('node app.js --files specs/data/overwrite/march/languages.csv')
                        .then(() => runCommand('node app.js --files specs/data/overwrite/april/languages.csv --overwrite'));
                });
        });

        afterEach(function () {
            return ensureTablesRemoved(['languages']);
        });

        it('Should have overwritten the table as expected', function () {
            return connectAndQuery('SELECT * FROM languages')
                .then(data => {
                    expect(data).to.deep.equal([
                        { ID: '1', 'LANGAUGE NAME': 'French', 'ISO 639-3': ' fra' },
                        { ID: '2', 'LANGAUGE NAME': ' Hindi', 'ISO 639-3': ' hin' }
                    ]);
                });
        });
    });

    describe('When the user specify a txt file to be inserted', function () {

        beforeEach(function () {
            return ensureTablesRemoved(['countries'])
                .then(() => {
                    return runCommand('node app.js --files specs/data/text_file/countries.txt');
                });
        });

        afterEach(function () {
            return ensureTablesRemoved(['countries']);
        });

        it('Should have been inserted the countries file as expected', function () {
            return connectAndQuery('SELECT * FROM countries')
                .then(data => {
                    expect(data).to.deep.equal([{ ID: '1', COUNTRY: 'United States', 'ISO CODES': 'US / USA' },
                    { ID: '2', COUNTRY: 'United Kingdom', 'ISO CODES': 'GB / GBR' },
                    { ID: '3', COUNTRY: 'France', 'ISO CODES': 'FR / FRA' }]);
                });
        });

    });

    describe('When the user specifies an extension-less file to be inserted', function () {

        beforeEach(function () {
            return ensureTablesRemoved(['test3'])
                .then(() => {
                    return runCommand('node app.js --files test3');
                });
        });

        afterEach(function () {
            return ensureTablesRemoved(['test3']);
        });

        xit('Should have been inserted the data as expected', function () {
            return connectAndQuery('SELECT * FROM test3')
                .then(data => {
                    expect(data).to.deep.equal([{ 'id': '1', 'Name': 'test 1' }]);
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


    describe('When the user specifies a file its name equal to contain backtick', function () {
        beforeEach(function () {
            return ensureTablesRemoved(['``'])
                .then(() => {
                    return runCommand('node app.js --files specs/data/backtick/`.csv')
                })
        });

        afterEach(function () {
            return ensureTablesRemoved(['``']);
        });

        it('Should have inserted the file without any error', function () {
            return connectAndQuery('SELECT * FROM ````;')
                .then(data => {
                    expect(data).to.deep.equal([{ id: '1', name: 'Sam Pauline' },
                    { id: '2', name: 'Kristen Cumberbatch' },
                    { id: '3', name: 'Roy Borne' }]);
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
    return mysql.createConnection(DB_CONFIG)
        .then(connection => {
            return Promise.all(
                tables.map(table => connection.query(`DROP TABLE IF EXISTS \`${table}\``))
            ).then(() => connection.end())
        });
}


function connectAndQuery(query) {
    return mysql.createConnection(DB_CONFIG)
        .then(connection => {
            return connection.query(query).finally(() => connection.end());
        });
}


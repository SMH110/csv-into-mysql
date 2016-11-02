const expect = require('chai').expect,
    runCommand = require('../run-command'),
    connectAndQuery = require('../connect-and-query'),
    ensureTablesRemoved = require('../ensure-tables-removed');


describe('XML to Mysql', function () {
    this.timeout(60000);
    describe('When the user inserts basic xml file to mysql using the --files flag', () => {
        beforeEach(() => {
            return ensureTablesRemoved(['basic-xml']).then(() => {
                return runCommand('node app.js --files specs/data/xml-to-mysql/basic-xml.xml');
            });
        });
        afterEach(() => {
            return ensureTablesRemoved(['basic-xml']);
        });

        it('Should have inserted the basic xml file as expected', () => {
            return connectAndQuery('SELECT * FROM `basic-xml`').then(data => {
                expect(data).to.deep.equal([
                    { Col1: 'Hi', Col2: 'Bye' },
                    { Col1: 'Foo', Col2: 'Bar' }
                ]);
            });
        });
    });

    describe('When the user inserts basic xml file to mysql using the --files flag and --append flag', () => {
        beforeEach(() => {
            return ensureTablesRemoved(['basic-xml']).then(() => {
                return runCommand('node app.js --files specs/data/xml-to-mysql/basic-xml.xml').then(() => {
                    return runCommand('node app.js --files specs/data/xml-to-mysql/basic-xml.xml --append')
                });
            });
        });
        afterEach(() => {
            return ensureTablesRemoved(['basic-xml']);
        });

        it('Should have inserted the basic xml file as expected', () => {
            return connectAndQuery('SELECT * FROM `basic-xml`').then(data => {
                expect(data).to.deep.equal([
                    { Col1: 'Hi', Col2: 'Bye' },
                    { Col1: 'Foo', Col2: 'Bar' },
                    { Col1: 'Hi', Col2: 'Bye' },
                    { Col1: 'Foo', Col2: 'Bar' }
                ]);
            });
        });
    });

    describe('When the user inserts basic xml file to mysql using the --files flag and --overwrite flag', () => {
        beforeEach(() => {
            return ensureTablesRemoved(['basic-xml']).then(() => {
                return runCommand('node app.js --files specs/data/xml-to-mysql/basic-xml.xml').then(() => {
                    return runCommand('node app.js --files specs/data/xml-to-mysql/overwrite/basic-xml.xml --overwrite')
                });
            });
        });
        afterEach(() => {
            return ensureTablesRemoved(['basic-xml']);
        });

        it('Should have inserted the basic xml file as expected', () => {
            return connectAndQuery('SELECT * FROM `basic-xml`').then(data => {
                expect(data).to.deep.equal([
                    { Col1: 'Hello', Col2: 'World!' }
                ]);
            });
        });
    });

    describe('When the user puts some mix csv and xml files in the file folder', () => {
        beforeEach(() => {
            return ensureTablesRemoved(['basic-xml', 'languages']).then(() => {
                return runCommand('node app.js --files specs/data/overwrite/april/languages.csv specs/data/xml-to-mysql/basic-xml.xml');
            });
        });
        afterEach(() => {
            return ensureTablesRemoved(['basic-xml', 'languages']);
        });

        it('Should have inserted the basic xml file as expected', () => {
            return connectAndQuery('SELECT * FROM `basic-xml`').then(data => {
                expect(data).to.deep.equal([
                    { Col1: 'Hi', Col2: 'Bye' },
                    { Col1: 'Foo', Col2: 'Bar' }
                ]);
            });
        });

        it('Should have inserted the languages csv files as expected', () => {
            return connectAndQuery('SELECT * FROM languages').then(data => {
                expect(data).to.deep.equal([
                    { ID: '1', 'LANGAUGE NAME': 'French', 'ISO 639-3': ' fra' },
                    { ID: '2', 'LANGAUGE NAME': ' Hindi', 'ISO 639-3': ' hin' }
                ]);
            });
        });
    });
});
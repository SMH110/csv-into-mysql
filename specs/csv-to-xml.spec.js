const expect = require('chai').expect,
    fs = require('fs'),
    runCommand = require('../run-command'),
    xmlReader = require('xmlreader');


describe.only('CSV to XML', function () {
    this.timeout(5000);

    describe('The XML library should work as expected', function () {
        it('Should output the XML file as expected', () => {
            return getXml('./specs/data/csv_files/xml-assertion-test.xml').then(xml => {
                expect(xml.data['basic-csv'].count()).to.equal(2);
                expect(xml.data['basic-csv'].at(0).Col1.text()).to.equal('Hi')
                expect(xml.data['basic-csv'].at(0).Col2.text()).to.equal('Bye')
                expect(xml.data['basic-csv'].at(1).Col1.text()).to.equal('Foo')
                expect(xml.data['basic-csv'].at(1).Col2.text()).to.equal('Bar')
            });
        });
    });

    describe('When the user converts a basic CSV file into a XML file', function () {
        beforeEach(() => {
            return runCommand('node app.js --output=xml --files specs/data/csv_files/basic-csv.csv');
        });

        afterEach(() => {
            return deleteFileIfExists('./specs/data/csv_files/basic-csv.xml');
        });

        it('Should output the XML file as expected', () => {
            return getXml('./specs/data/csv_files/basic-csv.xml').then(xml => {
                expect(xml.data['basic-csv'].count()).to.equal(2);
                expect(xml.data['basic-csv'].at(0).Col1.text()).to.equal('Hi')
                expect(xml.data['basic-csv'].at(0).Col2.text()).to.equal('Bye')
                expect(xml.data['basic-csv'].at(1).Col1.text()).to.equal('Foo')
                expect(xml.data['basic-csv'].at(1).Col2.text()).to.equal('Bar')
            });
        });
    });
});

function getXml(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (error, contents) => {
            if (error) {
                reject(error);
            } else {
                xmlReader.read(contents, (error, xml) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(xml);
                    }
                });
            }
        });
    });
}

function deleteFileIfExists(path) {
    return new Promise((resolve, reject) => {
        fs.unlink(path, () => resolve()); // Delete, ignoring errors
    });
}
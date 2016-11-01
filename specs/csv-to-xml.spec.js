const expect = require('chai').expect,
    fs = require('fs'),
    runCommand = require('../run-command'),
    xmlReader = require('xmlreader');


describe('CSV to XML', function () {
    this.timeout(5000);

    describe('The XML library should work as expected', () => {
        it('Should output the XML file as expected', () => {
            return getXml('./specs/data/csv-to-xml/xml-assertion-test.xml').then(xml => {
                expect(xml.data['basic-csv'].count()).to.equal(2);
                expect(xml.data['basic-csv'].at(0).Col1.text()).to.equal('Hi')
                expect(xml.data['basic-csv'].at(0).Col2.text()).to.equal('Bye')
                expect(xml.data['basic-csv'].at(1).Col1.text()).to.equal('Foo')
                expect(xml.data['basic-csv'].at(1).Col2.text()).to.equal('Bar')
            });
        });
    });

    describe('Using --files flag', () => {
        describe('When the user converts a basic CSV file into a XML file', () => {
            beforeEach(() => {
                return runCommand('node app.js --output=xml --files specs/data/csv-to-xml/basic-csv.csv');
            });

            afterEach(() => {
                return deleteFileIfExists('./specs/data/csv-to-xml/basic-csv.xml');
            });

            it('Should output the XML file as expected', () => {
                return getXml('./specs/data/csv-to-xml/basic-csv.xml').then(xml => {
                    expect(xml.data['basic-csv'].count()).to.equal(2);
                    expect(xml.data['basic-csv'].at(0).Col1.text()).to.equal('Hi')
                    expect(xml.data['basic-csv'].at(0).Col2.text()).to.equal('Bye')
                    expect(xml.data['basic-csv'].at(1).Col1.text()).to.equal('Foo')
                    expect(xml.data['basic-csv'].at(1).Col2.text()).to.equal('Bar')
                });
            });
        });

        describe('When the user converts a CSV file which contain a space in the column name into a XML file', () => {
            beforeEach(() => {
                return runCommand('node app.js --output=xml --files specs/data/csv-to-xml/csv-spaces-in-columns.csv');
            });

            afterEach(() => {
                return deleteFileIfExists('./specs/data/csv-to-xml/csv-spaces-in-columns.xml');
            });

            it('Should output the XML file as expected', () => {
                return getXml('./specs/data/csv-to-xml/csv-spaces-in-columns.xml').then(xml => {
                    expect(xml.data['csv-spaces-in-columns'].count()).to.equal(2);
                    expect(xml.data['csv-spaces-in-columns'].at(0).Col1.text()).to.equal('Hi')
                    expect(xml.data['csv-spaces-in-columns'].at(0).Col2.text()).to.equal('Bye')
                    expect(xml.data['csv-spaces-in-columns'].at(1).Col1.text()).to.equal('Foo')
                    expect(xml.data['csv-spaces-in-columns'].at(1).Col2.text()).to.equal('Bar')
                });
            });


        });

        describe('When the user converts a CSV file which contain a different characters in the column name -which need to be escaped- into a XML file', function () {
            beforeEach(() => {
                return runCommand('node app.js --output=xml --files specs/data/csv-to-xml/csv-characters-need-be-escaped-in-the-head.csv');
            });

            afterEach(() => {
                return deleteFileIfExists('./specs/data/csv-to-xml/csv-characters-need-be-escaped-in-the-head.xml');
            });

            it('Should output the XML file as expected', () => {
                return getXml('./specs/data/csv-to-xml/csv-characters-need-be-escaped-in-the-head.xml').then(xml => {
                    expect(xml.data['csv-characters-need-be-escaped-in-the-head'].count()).to.equal(2);
                    expect(xml.data['csv-characters-need-be-escaped-in-the-head'].at(0).Col1.text()).to.equal('Hi')
                });
            });

            it('Should remove all the invalid characters from the beginning of the columns name', () => {
                return getXml('./specs/data/csv-to-xml/csv-characters-need-be-escaped-in-the-head.xml').then(xml => {
                    expect(xml.data['csv-characters-need-be-escaped-in-the-head'].at(0).Col2.text()).to.equal('Bye')
                });
            });


            it('Should remove all the invalid characters from the columns name', () => {
                return getXml('./specs/data/csv-to-xml/csv-characters-need-be-escaped-in-the-head.xml').then(xml => {
                    expect(xml.data['csv-characters-need-be-escaped-in-the-head'].at(0).Col1.text()).to.equal('Hi')
                    expect(xml.data['csv-characters-need-be-escaped-in-the-head'].at(0).Col4.text()).to.equal('Boat')
                });
            });

            it('Should remove all invalid characters from the beginning of the column name like numbers and hyphen...etc', () => {
                return getXml('./specs/data/csv-to-xml/csv-characters-need-be-escaped-in-the-head.xml').then(xml => {
                    expect(xml.data['csv-characters-need-be-escaped-in-the-head'].at(0).Col5.text()).to.equal('Float')
                });
            });

            it('Should Auto rename the column name if there was no name left after removing all the invalid Characters from the beginning of the column name', () => {
                return getXml('./specs/data/csv-to-xml/csv-characters-need-be-escaped-in-the-head.xml').then(xml => {
                    expect(xml.data['csv-characters-need-be-escaped-in-the-head'].at(0).AutoColumnName_0.text()).to.equal('Note')
                });
            });
        });
    });
    describe(`When the user doesn't use the --files flag`, () => {
        beforeEach(() => {
            return runCommand('node app.js --output=xml');
        });

        afterEach(() => deleteFileIfExists('./files/t1.xml'));
        afterEach(() => deleteFileIfExists('./files/t2.xml'));
        it('Should convert t1.csv into xml files as expected', () => {
            return getXml('./files/t1.xml').then(xml => {
                expect(xml.data['t1'].at(0).id.text()).to.equal('1')
            });
        });

        it('Should convert t2.csv into xml files as expected', () => {
            return getXml('./files/t2.xml').then(xml => {
                expect(xml.data['t2'].at(0).COL1.text()).to.equal('"Hello, World!"')
            });
        });

    });

    describe('When the user converts a csv file which has characters need to be escaped in the rows', () => {
        beforeEach(() => {
            return runCommand('node app.js --output=xml --files ./specs/data/csv-to-xml/csv-five-characters-need-to-be-escaped-in-the-row.csv')
        });

        afterEach(() => deleteFileIfExists('./specs/data/csv-to-xml/csv-five-characters-need-to-be-escaped-in-the-row.xml'))

        it(`Should escape all the double quotes`, () => {
            return getXml('./specs/data/csv-to-xml/csv-five-characters-need-to-be-escaped-in-the-row.xml').then(xml => {
                expect(xml.data['csv-five-characters-need-to-be-escaped-in-the-row'].at(0).Col2.text()).to.equal(`"Bye"`)
            })
        });


        it(`Should escape all less than and greater than characters`, () => {
            return getXml('./specs/data/csv-to-xml/csv-five-characters-need-to-be-escaped-in-the-row.xml').then(xml => {
                expect(xml.data['csv-five-characters-need-to-be-escaped-in-the-row'].at(0).Col1.text()).to.equal(`<Hi>`)
            })
        });


        it(`Should escape all the single quotes`, () => {
            return getXml('./specs/data/csv-to-xml/csv-five-characters-need-to-be-escaped-in-the-row.xml').then(xml => {
                expect(xml.data['csv-five-characters-need-to-be-escaped-in-the-row'].at(1).Col1.text()).to.equal(`Foo'`)
            })
        });


        it(`Should escape all the & characters`, () => {
            return getXml('./specs/data/csv-to-xml/csv-five-characters-need-to-be-escaped-in-the-row.xml').then(xml => {
                expect(xml.data['csv-five-characters-need-to-be-escaped-in-the-row'].at(1).Col2.text()).to.equal(`&Bar&`)
            })
        });

    });

    describe('When the user uses the --append flag', () => {
        beforeEach(() => {
            return runCommand('node app.js --output=xml --files specs/data/csv-to-xml/basic-csv.csv')
                .then(() => {
                    return runCommand('node app.js --output=xml --append --files specs/data/csv-to-xml/basic-csv.csv')
                })
        });

        afterEach(() => {
            return deleteFileIfExists('./specs/data/csv-to-xml/basic-csv.xml');
        });

        it('Should have appended the xml data to the xml file as expected', () => {
            return getXml('./specs/data/csv-to-xml/basic-csv.xml').then(xml => {
                expect(xml.data['basic-csv'].count()).to.equal(4);
                expect(xml.data['basic-csv'].at(2).Col1.text()).to.equal('Hi')

            });
        });
    });


    describe('When the user uses the --overwrite flag', () => {
        beforeEach(() => {
            return runCommand('node app.js --output=xml --files specs/data/csv-to-xml/basic2-csv.csv')
                .then(() =>
                    readFile('specs/data/csv-to-xml/basic-csv.csv')
                ).then(csvData => writeToFile('specs/data/csv-to-xml/basic2-csv.csv', csvData))
                .then(() => runCommand('node app.js --output=xml --files specs/data/csv-to-xml/basic2-csv.csv --overwrite'))
                .catch(console.error)
        });

        afterEach(() => {
            return readFile('specs/data/csv-to-xml/basic3-csv.csv')
                .then(csvData => writeToFile('specs/data/csv-to-xml/basic2-csv.csv', csvData))
                .catch(error => console.error(error))
                .then(() => deleteFileIfExists('./specs/data/csv-to-xml/basic2-csv.xml'))

        });

        it('Should have overwritten the xml file as expected', () => {
            return getXml('./specs/data/csv-to-xml/basic2-csv.xml').then(xml => {
                expect(xml.data['basic2-csv'].count()).to.equal(2);
                expect(xml.data['basic2-csv'].at(0).Col1.text()).to.equal('Hi')
            });
        });
    });
});

function getXml(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (error, contents) => {
            if (error) {
                reject(new Error(`Error reading file at path ${path} for assertion: ` + error));
            } else {
                xmlReader.read(contents, (error, xml) => {
                    if (error) {
                        reject(new Error(`XML file at ${path} cannot be parsed for assertion: ` + error));
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


function writeToFile(path, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            };
        });
    });
}

function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf-8', (error, fileData) => {
            if (error) {
                reject(error);

            } else {
                resolve(fileData);
            }
        });
    });
}
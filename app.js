const readAndParse = require('./lib/read-and-parse'),
    csvToXml = require('./lib/csv-to-xml'),
    reaDirectory = require('./lib/read-directory'),
    path = require('path');

let insertingCase,
    isUserSpecifiedFilesToInsert = false,
    output = "mysql";

let args = process.argv,
    filesToInsert = [];

for (let i = 2; i < args.length; i++) {
    if (args[i] === "--files") {
        isUserSpecifiedFilesToInsert = true;
    }
    if (args[i] === '--append' || args[i] === '--overwrite') {
        insertingCase = args[i];
    }
    if ((args[i] !== "--append" && args[i] !== "--overwrite" && args[i] !== "--files" && args[i] !== "--output=xml") && isUserSpecifiedFilesToInsert) {
        filesToInsert.push(args[i]);
    }

    if (args[i] === "--output=xml") {
        output = "xml";
    }
}

new Promise((resolve, reject) => {
    if (filesToInsert.length && isUserSpecifiedFilesToInsert) {
        resolve(filesToInsert)
    } else {
        resolve(reaDirectory('./files/').then(files => files.map(file => `./files/${file}`)))
            .catch(error => { reject(error) })
    }
}).then(files => {

    return Promise.all(files.map(filePath => {
        // TODO...
        // output being passed into readAndParse shows that the interface
        // of the 2 writers is not the same (as the data they take is in a different shape)
        // and therefore they are not polymorphic.
        return readAndParse(filePath, output).then(csvData => {
            let writer = output === "xml" ? require("./lib/csv-to-xml") : require("./lib/csv-to-mysql");
            return writer.interface_(filePath, csvData, insertingCase)
        });
    }));
})
    .catch(console.error)

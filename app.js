const readFile = require('./lib/read-file'),
    readDirectory = require('./lib/read-directory'),
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
        resolve(filesToInsert);
    } else {
        resolve(readDirectory('./files/').then(files => files.map(file => `./files/${file}`)));
    }
}).then(files => {
    return Promise.all(files.map(filePath => {
        return readFile(filePath).then(data => {
            let parser = /\.xml$/.test(filePath) ? require('./lib/xml-parser') : require('./lib/csv-parser');
            return parser(data).then(data => {
                let writer = output === "xml" ? require("./lib/xml-writer") : require("./lib/mysql-writer");
                return writer.writer(filePath, data, insertingCase)
            });
        })
            .catch(console.error);
    }));
})


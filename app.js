let fs = require('fs');
let reservedWords = require('./reserved-word-sql');
let mysql = require('mysql');
let counter = 0;

let connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "user_database"
});

// get all the files inside the "files" folder; to filter the csv files later.
fs.readdir('./files/', 'utf8', (error, files) => {
    if (error) {
        console.error(error);
        return;
    }

    // function makes any unvaild csv's name valid
    function validFileName(file) {
        file = file.slice(0, -4);
        file = file.replace(/[^\@\$\%\w_\s]/g, "");
        if (/[^\w\$]/.test(file[(file.length) - 1])) {
            file = file + "_" + counter++;
        }
        if (reservedWords.indexOf(file.toUpperCase()) > -1 || file.indexOf(" ") > -1) {
            file = "`" + file + "`";
        }

        if (!file.length) {
            file = "table" + counter++;
        }
        return file;
    }

    // filter csv files, in case if there was other extension
    let csvFiles = files.filter(file => /(\.csv)$/.test(file));
    if (!csvFiles.length) { throw new Error('Not find csv file'); }

    // loop on each csv file in order to insert it to mysql database
    csvFiles.forEach((file, index, array) => {
        let validTableName = validFileName(file);

        let csvFile = fs.readFileSync(`./files/${file}`, "utf8");
        // split each csv file at the new line
        csvFile = csvFile.split("\n");
        let firstRow = csvFile[0].split(",").map(colName => colName.trim()).map(colName => colName.replace(/"|'/g,""));
        firstRow = "(" + firstRow.join(" TEXT, ") + " TEXT)";
        csvFile = csvFile.slice(1).map(col => col.trim());

        connection.query('CREATE TABLE ' + validTableName + firstRow, function (err, rows, fields) {
            if (err) console.error(err);

            csvFile.forEach((row, index, array) => {
                let colData = " (";
                row = row.split(",").map(colName => colName.trim()).map(colName => colName.replace(/"|'/g,""));
                for (let col of row) {
                    colData += "'" + col + "', ";
                }

                colData = colData.slice(0, -2) + ")";
                connection.query('INSERT INTO ' + `${validTableName}` + " VALUES" + colData, function (error, rows, fields) {
                    if (error) {
                        console.error(error);
                    }
                });
            });

            // end the query when you read all the files
            if (index === (array.length) - 1) {
                connection.end();
            }
        });
    });
});







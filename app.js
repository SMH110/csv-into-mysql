let fs = require('fs'),
    mysql = require('mysql'),
    parse = require('csv-parse');

const DB_CONFIG = require('./dbconfig.json');

// function makes any unvaild csv's name valid
function convertFileNameToTableName(file) {
    file = file.slice(0, -4).replace(/`/g, "``");

    return "`" + file + "`";
}

// Enumerate all files inside the "files" folder
fs.readdir('./files/', 'utf8', (error, files) => {
    if (error) {
        console.error(error);
        return;
    }

    // Filter csv files
    let csvFiles = files.filter(file => /(\.csv)$/.test(file));
    if (!csvFiles.length) {
        console.error(new Error('No CSV files found'));
        return;
    }

    // Loop on each csv file in order to insert it to mysql database
    csvFiles.forEach(file => {
        let csvFile = fs.readFileSync(`./files/${file}`, "utf8");
        let tableName = convertFileNameToTableName(file);
        let connection = mysql.createConnection(DB_CONFIG);

        parse(csvFile, { columns: true }, (error, data) => {
            if (error) {
                console.error(error);
                return;
            }

            const colsName = Object.keys(data[0]);
            let createTable = `CREATE TABLE ${tableName} (`;

            // take care of any column contain " or ' or space 
            if (colsName.join().indexOf(" ") > -1 || colsName.join().indexOf("'") > -1 || colsName.join().indexOf('"') > -1) {
                for (let column of colsName) {

                    if (column.indexOf(" ") > -1 || column.indexOf("'") > -1 || column.indexOf('"') > -1) {
                        createTable += '`' + column + '`' + " TEXT, ";
                    } else {
                        createTable += column + " TEXT, ";
                    }
                }
                createTable = createTable.slice(0, -2) + ")";
            } else {
                createTable += colsName.join(" TEXT, ") + " TEXT)";
            }


            connection.query(createTable, error => {
                if (error) {
                    console.error(error);
                    return;
                }

                let completedQueryCount = 0;
                data.forEach((row, index, array) => {
                    let rowToInsert = [];
                    for (let col in row) {
                        rowToInsert.push(row[col]);
                    }

                    connection.query(`INSERT INTO ${tableName} VALUES (${rowToInsert.map(x => {
                        x = x.replace(/"/g, '\\"');
                        return '"' + x + '"';
                    }).join()})`, error => {
                        // Close the connection once all queries are complete
                        if (++completedQueryCount === array.length) {
                            connection.end();
                        }

                        if (error) {
                            console.error(error);
                            return;
                        }
                    });
                });
            });
        });
    });
});

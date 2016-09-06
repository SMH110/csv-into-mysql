let fs = require('fs');
let reservedWords = require('./reserved-word-sql');
let mysql = require('mysql');
let counter = 0;

// function makes any unvaild csv's name valid
function convertFileNameToTableName(file) {
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
        let rows = csvFile.split("\n").map(row => row.trim());
        let columnNames = rows[0].split(",").map(colName => colName.trim() + ' TEXT');
        
        let connection = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "root",
            database: "user_database"
        });
        connection.query(`CREATE TABLE ${tableName} (${columnNames.join()})`, error => {
            if (error) {
                console.error(error);
                return;
            };

            let completedQueryCount = 0;
            let rowsToInsert = rows.slice(1);
            rowsToInsert.forEach(row => {
                let rowValues = row.split(",").map(colName => `'${colName.trim()}'`);

                connection.query(`INSERT INTO ${tableName} VALUES (${rowValues.join()})`, error => {
                   // Close the connection once all queries are complete
                    if (++completedQueryCount === rowsToInsert.length) {
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

# Simple Node.js program to insert CSV files into a MySQL database

## Installation
- Make sure MySQL is installed (see Installing MySQL below if you don't have it installed) and running
- If you want to use the default database and user then carry out the following steps:
```
c:\mysql\bin\mysql --user=root --execute="CREATE DATABASE importsdb;"
c:\mysql\bin\mysql --user=root --execute="CREATE USER 'import_user'@'localhost' IDENTIFIED BY 'password'; GRANT ALL PRIVILEGES ON * . * TO 'import_user'@'localhost'; FLUSH PRIVILEGES;"
```
- Alternatively, if you want to use a specific database and user then modify the username, password and database in the `dbconfig.json` file.
- Run `npm install`

## Usage
- Make sure MySQL is running
- Put any csv file(s) in the `files` folder, then run `node app.js`
- If you wanted to import a specific file(s); you can put them in the root directory then use `--files` flag followed by the files you want to import
i.e. `--files a.csv b.csv c.csv` or specify them if they weren't in the root directory i.e. `--files ../../csv_files/test.csv ../transactions/june/some.csv`
- Make sure your csv file(s) are valid
  - Columns should be separated by commas
  - The number of the columns should be consistent throughout the file

### Inserting type
  - If you wanted to overwrite an exist mysql table with new csv file; you can use the `--overwrite` flag i.e. `node app.js --overwrite`
  - If you wanted to append an exist mysql table with a csv file; you can use the `--append` flag i.e. `node app.js --append`

## Installing MySQL on Windows
- Download the noinstall package from [here (32-bit)](http://dev.mysql.com/downloads/file/?id=464459) or [here (64-bit)](http://dev.mysql.com/downloads/file/?id=464460)
- Extract to `C:\mysql`. The folder should directly contain the folders bin, docs, include...
- Create a file at the location `C:\mysql\bin\my.ini` with the following content:
```
[mysqld]
basedir=C:\\mysql
datadir=C:\\mydata\\data
```
- Open an administrator command prompt and navigate to `C:\mysql`
- Initialise the data directory with the following command `bin\mysqld --initialize`

## Running MySQL on Windows
- Open an administrator command prompt and navigate to `C:\mysql`
- Run the following command `bin\mysqld --console`

## Installing and Running MySQL on Unix / other platforms
- See the documentation at http://dev.mysql.com/doc/
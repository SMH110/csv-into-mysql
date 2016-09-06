# Simple Node.js program to insert CSV files into a MySQL database

## Installation
Run `npm install`

## How to use it
- Change the password in the `connection` varible in the `app.js` file to your password, and the database name to your database name.
- Put any csv file(s) in the `files` folder, then run `node app.js`.
- Make sure your csv file(s) are valid
  - Columns should be separated by commas
  - The number of the columns should be consistent throughout the file
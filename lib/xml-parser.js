const xml2json = require('xml2js').Parser;

let parser = new xml2json({ ignoreAttrs: true, explicitArray: false, explicitRoot: false }).parseString

module.exports = function (xml) {
    return new Promise((resolve, reject) => {
        parser(xml, (error, parsedData) => {
            if (error) {
                reject(error);
            } else {
                let keys = Object.keys(parsedData);
                let data = Array.isArray(parsedData[keys[0]]) ? parsedData[keys[0]] : [parsedData[keys[0]]];
                resolve(data);
            }
        })
    });
}
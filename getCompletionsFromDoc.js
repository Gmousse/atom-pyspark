'use strict';
const fs = require('fs');
const exec = require('child_process').exec;
const DocumentationToCompletionsParser = require('./DocumentationToCompletionsParser.js');

function readFile(path) {
    return fs.readFileSync(path, {encoding: 'utf-8'}).trim();
}

const documentationUrls = [
    'http://spark.apache.org/docs/latest/api/python/pyspark.html',
    'http://spark.apache.org/docs/latest/api/python/pyspark.sql.html',
];

const documentations = documentationUrls.map(urls => `./documentation/${urls.split('/').pop()}`);

const cleaningDocumentation = new Promise(resolve => {
    for (const documentation of documentations) {
        if (fs.existsSync(documentation)) {
            fs.unlinkSync(documentation);
        }
    }
    const completions = [];
    resolve(completions);
});

cleaningDocumentation.then((completions) => {
    exec(`wget --directory-prefix ./documentation ${documentationUrls.join(' ')}`, (error, stdout, stderr) => {
        for (const documentation of documentations) {
            const htmlContent = readFile(documentation);
            const parser = new DocumentationToCompletionsParser(htmlContent);
            completions = completions.concat(parser.getCompletions());
        }
        fs.writeFile('completions.json', JSON.stringify({
            PySpark: completions,
        }), 'utf-8');
    });
});

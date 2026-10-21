const fs = require('fs');
const { parseCSV } = require('./ledger.cjs');
const { summarize } = require('./report.cjs');

const inputFile = process.argv[2];

fs.readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err.message}`);
    process.exit(1);
  }
  try {
    const rows = parseCSV(data);
    const summary = summarize(rows);
    console.log(JSON.stringify(summary));
  } catch (e) {
    console.error(`Error parsing or summarizing file: ${e.message}`);
    process.exit(1);
  }
});

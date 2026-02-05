// Script to read .xls files using xlsx package
const XLSX = require('xlsx');
const path = require('path');

const dataDir = './data';

// Read 1st sem file
console.log('\n=== student masterlist 1st sem 2025-2026.xls ===');
const sem1Path = path.join(dataDir, 'student masterlist 1st sem 2025-2026.xls');
const sem1Workbook = XLSX.readFile(sem1Path);
console.log('Sheets:', sem1Workbook.SheetNames);

// Read first sheet
const sem1Sheet = sem1Workbook.Sheets[sem1Workbook.SheetNames[0]];
const sem1Data = XLSX.utils.sheet_to_json(sem1Sheet, { header: 1 });
console.log('First 15 rows:');
sem1Data.slice(0, 15).forEach((row, i) => {
    console.log(`Row ${i}: ${JSON.stringify(row)}`);
});

console.log('\n--- Total rows in 1st sem:', sem1Data.length);

// Read 2nd sem file
console.log('\n=== student masterlist 2nd sem 2025-2026.xls ===');
const sem2Path = path.join(dataDir, 'student masterlist 2nd sem 2025-2026.xls');
const sem2Workbook = XLSX.readFile(sem2Path);
console.log('Sheets:', sem2Workbook.SheetNames);

const sem2Sheet = sem2Workbook.Sheets[sem2Workbook.SheetNames[0]];
const sem2Data = XLSX.utils.sheet_to_json(sem2Sheet, { header: 1 });
console.log('First 15 rows:');
sem2Data.slice(0, 15).forEach((row, i) => {
    console.log(`Row ${i}: ${JSON.stringify(row)}`);
});

console.log('\n--- Total rows in 2nd sem:', sem2Data.length);

// Also read COLLEGES.xlsx
console.log('\n=== COLLEGES.xlsx ===');
const collegesPath = path.join(dataDir, 'COLLEGES.xlsx');
const collegesWorkbook = XLSX.readFile(collegesPath);
const collegesSheet = collegesWorkbook.Sheets[collegesWorkbook.SheetNames[0]];
const collegesData = XLSX.utils.sheet_to_json(collegesSheet, { header: 1 });
console.log('All rows:');
collegesData.forEach((row, i) => {
    if (row.length > 0) {
        console.log(`Row ${i}: ${JSON.stringify(row)}`);
    }
});

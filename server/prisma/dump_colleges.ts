
import XLSX from 'xlsx';
import path from 'path';

const collegesPath = path.join(__dirname, 'data', 'COLLEGES.xlsx');
const workbook = XLSX.readFile(collegesPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
import fs from 'fs';
fs.writeFileSync('colleges_dump.json', JSON.stringify(data, null, 2));
console.log('Dumped to colleges_dump.json');

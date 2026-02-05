
import XLSX from 'xlsx';
import path from 'path';

const collegesPath = path.join(__dirname, 'data', 'COLLEGES.xlsx');
const workbook = XLSX.readFile(collegesPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log(JSON.stringify(data, null, 2));

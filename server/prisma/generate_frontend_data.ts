
import XLSX from 'xlsx';
import path from 'path';

const collegesPath = path.join(__dirname, 'data', 'COLLEGES.xlsx');
const workbook = XLSX.readFile(collegesPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

const map: Record<string, string[]> = {};

data.slice(1).forEach(row => {
    if (!row[0] || !row[1]) return;
    const college = row[0] as string;
    const program = row[1] as string;

    if (!map[college]) map[college] = [];
    map[college].push(program);
});

console.log('const COLLEGE_PROGRAMS: Record<string, string[]> = ' + JSON.stringify(map, null, 2));
console.log('const COLLEGE_LIST = Object.keys(COLLEGE_PROGRAMS)');

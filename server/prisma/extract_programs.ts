
import XLSX from 'xlsx';
import path from 'path';

const sem1Path = path.join(__dirname, 'data', 'student masterlist 1st sem 2025-2026.xls');
const workbook = XLSX.readFile(sem1Path);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

console.log('Total rows:', data.length);

console.log('--- DUMPING ROWS 0-10 ---');
for (let i = 0; i <= 10; i++) {
    console.log(`Row ${i}:`, JSON.stringify(data[i]));
}

// Try to find "Program" or "Course" in the first 10 rows
let headerRowIndex = -1;
let programIndex = -1;

for (let i = 0; i < 10; i++) {
    const row = data[i];
    if (!row) continue;
    const idx = row.findIndex((cell: any) =>
        cell && (String(cell).toLowerCase().includes('program') || String(cell).toLowerCase().includes('course'))
    );
    if (idx !== -1) {
        headerRowIndex = i;
        programIndex = idx;
        console.log(`FOUND HEADER at Row ${i}, Column ${idx}: ${row[idx]}`);
        break;
    }
}

// Search for specific student
const targetId = '22-08609';

for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row && String(row[1]).includes(targetId)) {
        console.log(`FOUND STUDENT at Row ${i}:`);
        console.log(JSON.stringify(row));
        console.log('Program (Col 5):', row[5]);
        break;
    }
}

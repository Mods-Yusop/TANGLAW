
import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';
import path from 'path';

async function main() {
    console.log('🔍 Debugging College Mapping...');
    const collegesPath = path.join(__dirname, 'data', 'COLLEGES.xlsx');
    const collegesWorkbook = XLSX.readFile(collegesPath);
    const collegesSheet = collegesWorkbook.Sheets[collegesWorkbook.SheetNames[0]];
    const collegesData = XLSX.utils.sheet_to_json(collegesSheet, { header: 1 }) as any[][];

    const programToCollege: Record<string, string> = {};

    collegesData.slice(1).forEach((row, index) => {
        if (!row[0] || !row[1]) return;
        const college = row[0] as string;
        const programFull = row[1] as string;

        const match = programFull.match(/\(([^)]+)\)/);
        if (match) {
            const abbr = match[1];
            // Log if we are overwriting
            if (programToCollege[abbr]) {
                console.log(`⚠️ OVERWRITE: ${abbr} was ${programToCollege[abbr]}, now becoming ${college} (Row ${index + 2})`);
            }
            programToCollege[abbr] = college;

            if (abbr === 'BSAccnty') {
                console.log(`✅ FOUND BSAccnty: Mapped to ${college} (Row ${index + 2})`);
            }
        }
    });

    console.log('\nFinal Mapping for BSAccnty:', programToCollege['BSAccnty']);
}

main();

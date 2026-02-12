
import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Starting College Repair Script...');

    // 1. Load College-Program mapping from COLLEGES.xlsx
    console.log('📚 Loading mappings from COLLEGES.xlsx...');
    const collegesPath = path.join(__dirname, 'data', 'COLLEGES.xlsx');
    const collegesWorkbook = XLSX.readFile(collegesPath);
    const collegesSheet = collegesWorkbook.Sheets[collegesWorkbook.SheetNames[0]];
    const collegesData = XLSX.utils.sheet_to_json(collegesSheet, { header: 1 }) as any[][];

    const programToCollege: Record<string, string> = {};
    collegesData.slice(1).forEach(row => {
        if (!row[0] || !row[1]) return;
        const college = row[0] as string;
        const programFull = row[1] as string;

        const match = programFull.match(/\(([^)]+)\)/);
        if (match) {
            const abbr = match[1];
            programToCollege[abbr] = college;
        }
    });

    console.log(`✅ Loaded Mappings: ${Object.keys(programToCollege).length} programs.`);

    // 2. Fetch all students
    const students = await prisma.student.findMany();
    console.log(`👥 Checking ${students.length} students...`);

    let updatedCount = 0;
    let errors = 0;

    for (const student of students) {
        // Skip correct ones
        if (!student.program) continue;

        const correctCollege = programToCollege[student.program];

        // If we have a mapping and it mismatches
        if (correctCollege && correctCollege !== student.college) {
            console.log(`Mismatch found for ${student.firstName} ${student.lastName} (${student.program}):`);
            console.log(`   Current: ${student.college}`);
            console.log(`   Correct: ${correctCollege}`);

            try {
                await prisma.student.update({
                    where: { id: student.id },
                    data: { college: correctCollege }
                });
                console.log('   ✅ FIXED');
                updatedCount++;
            } catch (e) {
                console.error('   ❌ FAILED to update:', e);
                errors++;
            }
        }
    }

    console.log('\n--- Repair Summary ---');
    console.log(`Total Checked: ${students.length}`);
    console.log(`Fixed: ${updatedCount}`);
    console.log(`Errors: ${errors}`);
    console.log('----------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

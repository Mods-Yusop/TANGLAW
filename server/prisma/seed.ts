import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import XLSX from 'xlsx';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    // 0. Clear existing data to avoid Foreign Key conflicts
    console.log('\n🗑️  Clearing existing data...');
    await prisma.transaction.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.student.deleteMany({});

    // 1. Create Admin Staff (Password is the PIN: 024434)
    const adminPassword = await bcrypt.hash('024434', 10);

    // Clear existing staff first to ensure clean state from Excel
    await prisma.staff.deleteMany({});

    console.log('✨ Creating Admin Account (Password/PIN: 024434)...');
    const admin = await prisma.staff.create({
        data: {
            name: 'Editor In Chief',
            position: 'EIC',
            username: 'eic',
            password: adminPassword,
            role: 'ADMIN'
        }
    });

    // 2. Load Staff Accounts from Accounts.xlsx
    console.log('\n👥 Loading Staff Accounts from Accounts.xlsx...');
    const accountsPath = path.join(__dirname, 'data', 'Accounts.xlsx');
    const accountsWorkbook = XLSX.readFile(accountsPath);
    const accountsSheet = accountsWorkbook.Sheets[accountsWorkbook.SheetNames[0]];
    const accountsData = XLSX.utils.sheet_to_json(accountsSheet) as any[];

    for (const acc of accountsData) {
        if (!acc.Username || !acc.Password) continue;

        const passwordHash = await bcrypt.hash(String(acc.Password), 10);

        await prisma.staff.create({
            data: {
                name: acc.Name || acc.Username,
                position: acc.Position || 'Staff',
                username: acc.Username,
                password: passwordHash,
                role: 'STAFF' // Default role for imported accounts
            }
        });
        console.log(`   - Created staff: ${acc.Username}`);
    }

    console.log({ admin });

    // 3. Load College-Program mapping from COLLEGES.xlsx
    console.log('\n📚 Loading college-program mappings...');
    const collegesPath = path.join(__dirname, 'data', 'COLLEGES.xlsx');
    const collegesWorkbook = XLSX.readFile(collegesPath);
    const collegesSheet = collegesWorkbook.Sheets[collegesWorkbook.SheetNames[0]];
    const collegesData = XLSX.utils.sheet_to_json(collegesSheet, { header: 1 }) as any[][];

    // Build a map: Program abbreviation -> College
    const programToCollege: Record<string, string> = {};
    collegesData.slice(1).forEach(row => {
        if (!row[0] || !row[1]) return;
        const college = row[0] as string;
        const programFull = row[1] as string;

        // Extract abbreviation from program (text in parentheses)
        // Format: "Bachelor of Science in Criminology (BSCriminology)" -> "BSCriminology"
        const match = programFull.match(/\(([^)]+)\)/);
        if (match) {
            const abbr = match[1];
            programToCollege[abbr] = college;
        }
    });

    console.log(`✅ Mapped ${Object.keys(programToCollege).length} programs to colleges`);

    // 4. Load Student Data from both Excel files
    console.log('\n📋 Loading student data from Excel files...');
    const sem1Path = path.join(__dirname, 'data', 'student masterlist 1st sem 2025-2026.xls');
    const sem2Path = path.join(__dirname, 'data', 'student masterlist 2nd sem 2025-2026.xls');

    const sem1Workbook = XLSX.readFile(sem1Path);
    const sem2Workbook = XLSX.readFile(sem2Path);

    const sem1Sheet = sem1Workbook.Sheets[sem1Workbook.SheetNames[0]];
    const sem2Sheet = sem2Workbook.Sheets[sem2Workbook.SheetNames[0]];

    const sem1Data = XLSX.utils.sheet_to_json(sem1Sheet, { header: 1 }) as any[][];
    const sem2Data = XLSX.utils.sheet_to_json(sem2Sheet, { header: 1 }) as any[][];

    // Parse student records (skip header rows)
    const parseStudents = (data: any[][]) => {
        const students: any[] = [];
        // Find header row (contains "ID No.")
        const headerIdx = data.findIndex(row => row.includes("ID No."));
        if (headerIdx === -1) return students;

        for (let i = headerIdx + 1; i < data.length; i++) {
            const row = data[i];
            if (!row[1] || !row[2]) continue; // Skip if no ID or Name

            const idNo = String(row[1]).trim();
            const fullName = String(row[2]).trim();
            const yearLevelRaw = String(row[4] || '').trim();
            const programAbbr = String(row[5] || '').trim();

            // Parse name: "Last, First M." -> firstName, lastName, middleInitial
            const nameParts = fullName.split(',').map(p => p.trim());
            if (nameParts.length < 2) continue;

            const lastName = nameParts[0];
            const firstAndMiddle = nameParts[1];

            // Extract middle initial (last word if it ends with a period)
            const parts = firstAndMiddle.split(' ');
            let firstName = firstAndMiddle;
            let middleInitial = '';

            if (parts.length > 1) {
                const lastPart = parts[parts.length - 1];
                // Check if last part is an initial (1 letter + dot) or just 1 letter
                if (lastPart.length <= 2 && lastPart.endsWith('.')) {
                    middleInitial = lastPart; // Keep the dot as requested: "G."
                    firstName = parts.slice(0, -1).join(' ');
                } else if (lastPart.length === 1) {
                    middleInitial = lastPart + '.'; // Add dot if missing
                    firstName = parts.slice(0, -1).join(' ');
                }
            }

            // Parse year level: "4th Year" -> 4
            const yearMatch = yearLevelRaw.match(/(\d+)/);
            const yearLevel = yearMatch ? parseInt(yearMatch[1]) : 4;

            // Map program to college
            const college = programToCollege[programAbbr] || 'N/A';

            students.push({
                id: idNo,
                firstName,
                lastName,
                middleInitial: middleInitial, // Dot is already preserved
                college,
                program: programAbbr,
                yearLevel,
                section: 'N/A'
            });
        }
        return students;
    };

    const sem1Students = parseStudents(sem1Data);
    const sem2Students = parseStudents(sem2Data);

    console.log(`✅ Parsed ${sem1Students.length} students from 1st sem`);
    console.log(`✅ Parsed ${sem2Students.length} students from 2nd sem`);

    // Merge and deduplicate by ID
    const allStudentsMap = new Map();
    [...sem1Students, ...sem2Students].forEach(student => {
        if (!allStudentsMap.has(student.id)) {
            allStudentsMap.set(student.id, student);
        }
    });

    const uniqueStudents = Array.from(allStudentsMap.values());
    console.log(`✅ Total unique students: ${uniqueStudents.length}`);

    // 5. Seed Database
    // (Cleared at start)
    // console.log('\n🗑️  Clearing existing data...');
    // await prisma.transaction.deleteMany({});
    // await prisma.student.deleteMany({});

    console.log('💾 Seeding students into database...');
    let count = 0;
    for (const s of uniqueStudents) {
        await prisma.student.create({
            data: {
                id: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
                middleInitial: s.middleInitial || '',
                college: s.college,
                program: s.program,
                yearLevel: s.yearLevel,
                section: s.section,
                totalPaid: 0,
                balance: 265, // Default for Package A
                paymentStatus: 'UNPAID',
                packageType: 'A'
            }
        });
        count++;
        if (count % 500 === 0) {
            console.log(`  ... seeded ${count} students`);
        }
    }

    console.log(`✅ Seeding finished! Total: ${uniqueStudents.length} students`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

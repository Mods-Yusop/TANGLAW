
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import XLSX from 'xlsx';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const accountsPath = path.join(__dirname, 'data', 'Accounts.xlsx');
    const workbook = XLSX.readFile(accountsPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const accountsData = XLSX.utils.sheet_to_json(sheet) as any[];

    console.log(`Syncing passwords for ${accountsData.length} staff accounts...`);

    for (const acc of accountsData) {
        if (!acc.Username || !acc.Password) continue;

        const passwordString = String(acc.Password);
        const passwordHash = await bcrypt.hash(passwordString, 10);

        // Update if exists
        const user = await prisma.staff.findUnique({ where: { username: acc.Username } });

        if (user) {
            await prisma.staff.update({
                where: { username: acc.Username },
                data: { password: passwordHash }
            });
            console.log(`✅ Updated password for ${acc.Username}`);
        } else {
            console.log(`⚠️ User ${acc.Username} not found (Seed mismatch?), skipping.`);
        }
    }
}

main().finally(async () => await prisma.$disconnect());

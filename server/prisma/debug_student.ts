
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Inspecting Crislyn Abayon...');

    // Try finding by name or ID (from screenshot ID seems like 22-something)
    // Screenshot shows: Crislyn Abayon

    const students = await prisma.student.findMany({
        where: {
            OR: [
                { lastName: 'Abayon' },
                { firstName: { contains: 'Crislyn' } }
            ]
        }
    });

    console.log(`Found ${students.length} students.`);
    students.forEach(s => {
        console.log('---');
        console.log(`ID: ${s.id}`);
        console.log(`Name: ${s.firstName} ${s.lastName}`);
        console.log(`Program: '${s.program}' (Length: ${s.program?.length})`);
        console.log(`College: '${s.college}'`);

        // Check ASCII bytes of program to find hidden chars
        if (s.program) {
            console.log(`Program Bytes: ${Buffer.from(s.program).toString('hex')}`);
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

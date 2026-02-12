
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Inspecting Missy Viel Gahuman...');

    // ID from screenshot: 22-65888 (approx reading)
    // Let's search by name to be sure
    const students = await prisma.student.findMany({
        where: {
            OR: [
                { lastName: 'Gahuman' },
                { firstName: { contains: 'Missy' } }
            ]
        }
    });

    console.log(`Found ${students.length} students.`);
    students.forEach(s => {
        console.log(`ID: ${s.id}`);
        console.log(`Name: ${s.firstName} ${s.lastName}`);
        console.log(`Program: '${s.program}'`);
        console.log(`College: '${s.college}'`);
        console.log(`Program Bytes: ${Buffer.from(s.program || '').toString('hex')}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

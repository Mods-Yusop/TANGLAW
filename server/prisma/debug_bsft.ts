
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Inspecting BSFT Students (e.g., Hanna Joy Fausto)...');

    // Find Hanna
    const students = await prisma.student.findMany({
        where: {
            OR: [
                { lastName: 'Fausto' },
                { program: 'BSFT' }
            ]
        },
        take: 5
    });

    console.log(`Found ${students.length} samples.`);
    students.forEach(s => {
        console.log(`ID: ${s.id}, Name: ${s.firstName} ${s.lastName}, Program: '${s.program}', College: '${s.college}'`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

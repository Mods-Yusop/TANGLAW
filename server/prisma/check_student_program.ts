
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const student = await prisma.student.findUnique({
        where: { id: '20-40012' }
    });
    if (student) {
        console.log('Program encoded in DB:', JSON.stringify(student.program));
        console.log('College:', student.college);
    } else {
        console.log('Student not found');
    }
}

main().finally(() => prisma.$disconnect());

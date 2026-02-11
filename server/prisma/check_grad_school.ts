import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Unique Programs for CBDEM and CHK...');

    const cbdemStudents = await prisma.student.findMany({
        where: { college: { contains: 'CBDEM' } },
        select: { program: true },
        distinct: ['program']
    });
    console.log('--- CBDEM Programs in DB ---');
    cbdemStudents.forEach(s => console.log(`'${s.program}'`));

    const chkStudents = await prisma.student.findMany({
        where: { college: { contains: 'CHK' } },
        select: { program: true },
        distinct: ['program']
    });
    console.log('--- CHK Programs in DB ---');
    chkStudents.forEach(s => console.log(`'${s.program}'`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking CBDEM Data...');

    // 1. Check for students with College = 'CBDEM'
    const cbdemStudents = await prisma.student.findMany({
        where: {
            college: { contains: 'CBDEM' }
        },
        take: 5
    });

    console.log(`Found ${cbdemStudents.length} students with 'CBDEM' in college field:`);
    console.log(cbdemStudents);

    // 2. Check unique college names in the database
    const allStudents = await prisma.student.findMany({ select: { college: true } });
    const uniqueColleges = [...new Set(allStudents.map(s => s.college))];

    console.log('\nUnique Colleges in Database:');
    console.log(uniqueColleges);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

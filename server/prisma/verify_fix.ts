
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    process.stdout.write('🔍 Verifying...\n');

    const badStudents = await prisma.student.count({
        where: {
            program: 'BSAccnty',
            college: { not: 'CBDEM' }
        }
    });

    const caAnalysis = await prisma.student.count({
        where: {
            college: 'CA',
            program: 'BSAccnty'
        }
    });

    const goodStudents = await prisma.student.count({
        where: { program: 'BSAccnty', college: 'CBDEM' }
    });

    console.log(`❌ Bad BSAccnty Count: ${badStudents}`);
    console.log(`❌ BSAccnty in CA: ${caAnalysis}`);
    console.log(`✅ Good BSAccnty Count: ${goodStudents}`);

    if (badStudents === 0 && caAnalysis === 0) {
        console.log('SUCCESS: All clean.');
    } else {
        console.log('FAILURE: Still have bad data.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching unique programs from transactions...');

    const transactions = await prisma.transaction.findMany({
        where: { isVoid: false },
        include: { student: true }
    });

    const programCounts: Record<string, number> = {};

    transactions.forEach(tx => {
        const prog = tx.student.program || 'NULL/EMPTY';
        programCounts[prog] = (programCounts[prog] || 0) + 1;
    });

    console.log('\n--- Program Counts ---');
    const sorted = Object.entries(programCounts).sort((a, b) => b[1] - a[1]);
    for (const [prog, count] of sorted) {
        console.log(`${count}: ${prog}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

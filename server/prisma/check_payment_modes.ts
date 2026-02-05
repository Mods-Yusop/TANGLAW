
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const modes = await prisma.transaction.groupBy({
        by: ['paymentMode'],
        _count: {
            paymentMode: true
        }
    });

    console.log('--- Payment Modes Found ---');
    modes.forEach(m => {
        console.log(`"${m.paymentMode}": ${m._count.paymentMode} transactions`);
    });
}

main().finally(async () => await prisma.$disconnect());

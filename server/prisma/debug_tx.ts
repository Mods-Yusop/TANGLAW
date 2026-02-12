
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Inspecting Transactions for 22-24994...');

    const txs = await prisma.transaction.findMany({
        where: {
            studentId: '22-24994'
        },
        include: {
            student: true
        }
    });

    console.log(`Found ${txs.length} transactions.`);
    txs.forEach(tx => {
        console.log(`TX ID: ${tx.id}`);
        console.log(`Amount: ${tx.amountPaid}`);
        console.log(`Student Program (in TX include): '${tx.student.program}'`);
        console.log(`Student College (in TX include): '${tx.student.college}'`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

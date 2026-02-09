
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching transactions...');
    const transactions = await prisma.transaction.findMany({
        include: {
            student: true,
            staff: true
        },
        where: { isVoid: false },
        take: 50 // Limit to first 50 for quick test
    });

    console.log(`Found ${transactions.length} transactions.`);

    for (const tx of transactions) {
        try {
            const data = [
                tx.id,
                tx.studentId,
                `${tx.student.firstName} ${tx.student.lastName}`,
                tx.student.program,
                tx.packageTypeSnapshot || '-',   // Potential null
                parseFloat(tx.amountPaid.toString()),
                parseFloat((tx.student.balance || 0).toString()), // Potential null
                tx.paymentMode,
                tx.orNumber,
                tx.student.paymentStatus, // Enum
                tx.staff.name,
                new Date(tx.createdAt).toLocaleDateString(),
                new Date(tx.createdAt).toLocaleTimeString()
            ];
            console.log(`✅ OK: Tx ID ${tx.id}`);
        } catch (err) {
            console.error(`❌ FAILED: Tx ID ${tx.id}`, err);
            console.error('Data:', tx);
        }
    }
}

main().finally(() => prisma.$disconnect());

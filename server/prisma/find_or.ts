import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const orNumber = process.argv[2] || '0012573';
    console.log(`Checking for OR Number: "${orNumber}"...`);

    const tx = await prisma.transaction.findFirst({
        where: {
            orNumber: orNumber
        },
        include: {
            student: true,
            staff: true
        }
    });

    if (tx) {
        console.log('❌ FOUND EXISTING TRANSACTION:');
        console.log(tx);
    } else {
        console.log('✅ OR Number is AVAILABLE (Not found in DB).');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

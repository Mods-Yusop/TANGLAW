
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const staff = await prisma.staff.findMany();
    console.log('--- STAFF ACCOUNTS ---');
    staff.forEach(s => {
        console.log(`ID: ${s.id}, Username: ${s.username}, Name: ${s.name}, Role: ${s.role}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

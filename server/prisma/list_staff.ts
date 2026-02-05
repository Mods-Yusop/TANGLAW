
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const staff = await prisma.staff.findMany();
    console.log("Current Staff List:");
    staff.forEach(s => console.log(`- ${s.username} (${s.role})`));
}

main().finally(() => prisma.$disconnect());

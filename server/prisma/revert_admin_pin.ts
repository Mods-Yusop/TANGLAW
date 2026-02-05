
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const pin = '024434';
    const hash = await bcrypt.hash(pin, 10);

    // Update Admin (eic)
    await prisma.staff.update({
        where: { username: 'eic' },
        data: { password: hash }
    });

    console.log(`✅ Admin PIN reverted to: ${pin}`);
}

main().finally(async () => await prisma.$disconnect());

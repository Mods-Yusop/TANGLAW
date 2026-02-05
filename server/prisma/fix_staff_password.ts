
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const passwordRaw = 'Rgb_Cmky$55';
    const passwordHash = await bcrypt.hash(passwordRaw, 10);

    const updated = await prisma.staff.update({
        where: { username: 'kevin.redondiez' },
        data: { password: passwordHash }
    });

    console.log(`Updated password for ${updated.username}`);
}

main().finally(async () => await prisma.$disconnect());

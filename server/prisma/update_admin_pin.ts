
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Determine the common password/PIN
    const commonPin = 'Rgb_Cmky$55';
    const hash = await bcrypt.hash(commonPin, 10);

    // Update Admin (eic)
    await prisma.staff.update({
        where: { username: 'eic' },
        data: { password: hash }
    });

    console.log(`✅ Admin PIN updated to: ${commonPin}`);
}

main().finally(async () => await prisma.$disconnect());


import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.staff.findUnique({
        where: { username: 'kevin.redondiez' }
    });

    if (!user) {
        console.log('User not found.');
        return;
    }

    const passwordToTest = 'Rgb_Cmky$55';
    const isValid = await bcrypt.compare(passwordToTest, user.password);

    console.log(`Testing password: "${passwordToTest}"`);
    console.log(`Is Valid: ${isValid}`);
}

main().finally(async () => await prisma.$disconnect());

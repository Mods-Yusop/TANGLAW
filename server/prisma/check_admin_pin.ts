
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.staff.findFirst({
        where: { role: 'ADMIN' }
    });

    if (!admin) {
        console.error('❌ No Admin account found!');
        return;
    }

    console.log(`FOUND ADMIN: ${admin.username} (${admin.name})`);

    // Check if PIN works
    const isMatch = await bcrypt.compare('024434', admin.password);

    if (isMatch) {
        console.log('✅ Admin PIN "024434" is VALID.');
    } else {
        console.error('❌ Admin PIN "024434" is INVALID. Updating it now...');

        const newHash = await bcrypt.hash('024434', 10);
        await prisma.staff.update({
            where: { id: admin.id },
            data: { password: newHash }
        });
        console.log('✅ Admin PIN successfully reset to "024434".');
    }
}

main().finally(async () => await prisma.$disconnect());

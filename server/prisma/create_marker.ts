
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📍 Creating Marker Student...');

    // Check if exists
    const existing = await prisma.student.findUnique({
        where: { id: 'DEBUG-001' }
    });

    if (existing) {
        console.log('Marker already exists.');
    } else {
        await prisma.student.create({
            data: {
                id: 'DEBUG-001',
                firstName: 'DEBUG_MARKER',
                lastName: 'TEST',
                college: 'CBDEM',
                program: 'BSAccnty',
                yearLevel: 1,
                section: 'A',
                paymentStatus: 'UNPAID',
                balance: 500,
                totalPaid: 0
            }
        });
        console.log('✅ Created marker student: DEBUG_MARKER (DEBUG-001)');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

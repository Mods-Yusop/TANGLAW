import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Log an audit action
export const logAudit = async (
    staffId: number,
    actionType: string,
    description: string
) => {
    try {
        await prisma.auditLog.create({
            data: {
                staffId,
                actionType,
                description
            }
        });
    } catch (error) {
        console.error('Audit log failed:', error);
    }
};

// GET /api/audit - Get all audit logs (Admin only)
router.get('/', async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            include: { staff: true },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

export default router;

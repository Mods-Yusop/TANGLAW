import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Search Students
router.get('/search', async (req, res) => {
    const { q } = req.query;

    if (!q) return res.json([]);

    try {
        const students = await prisma.student.findMany({
            where: {
                id: { contains: String(q) }
            },
            take: 5
        });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get Single Student
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const student = await prisma.student.findUnique({ where: { id } });
        if (!student) return res.status(404).json({ error: 'Not found' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching student' });
    }
});

export default router;

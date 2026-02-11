import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// All colleges list
// All colleges list for reporting
const ALL_COLLEGES = [
    'CASS', 'CBDEM', 'CHEFS', 'CA', 'CHS', 'IMEAS', 'CHK', 'CED', 'CVM', 'CTI', 'MEDICINE', 'CSM', 'CEIT',
    'Libungan', 'Mlang', 'Aleosan', 'Grad School', 'COL'
];

// Helper to map database college string to report group
const mapToCollegeGroup = (dbCollege: string): string => {
    if (!dbCollege) return 'Unknown';
    const c = dbCollege.trim();

    // Acronyms from DB
    if (c === 'GS') return 'Grad School';
    if (c.endsWith('-LC')) return 'Libungan';
    if (c.endsWith('-MC')) return 'Mlang';
    if (c.endsWith('-AL') || c.endsWith('-AC')) return 'Aleosan';

    if (c.includes('Libungan')) return 'Libungan';
    if (c.includes('Mlang')) return 'Mlang';
    if (c.includes('Aleosan')) return 'Aleosan';
    if (c.includes('Graduate School')) return 'Grad School';

    // Exact matches or standard mappings
    if (c === 'MED') return 'MEDICINE';
    if (c === 'Medicine') return 'MEDICINE';

    return c;
};

// GET /api/analytics - Get aggregated stats
router.get('/', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all transactions (non-void)
        const transactions = await prisma.transaction.findMany({
            where: { isVoid: false },
            include: { student: true, staff: true }
        });

        // Get all students
        const students = await prisma.student.findMany();

        // Calculate totals
        const totalCollections = transactions.reduce((sum, tx) => sum + parseFloat(tx.amountPaid.toString()), 0);

        const todayCollections = transactions
            .filter(tx => new Date(tx.createdAt) >= today)
            .reduce((sum, tx) => sum + parseFloat(tx.amountPaid.toString()), 0);

        // Student payment status
        const fullyPaid = students.filter(s => s.paymentStatus === 'FULLY_PAID').length;
        const partialPaid = students.filter(s => s.paymentStatus === 'PARTIAL').length;

        // Package breakdown
        const packageA = transactions.filter(tx => tx.packageTypeSnapshot === 'A').length;
        const packageB = transactions.filter(tx => tx.packageTypeSnapshot === 'B').length;
        const packageC = transactions.filter(tx => tx.packageTypeSnapshot === 'C').length;

        // Collections by college (with student count)
        const collegeBreakdown: Record<string, { amount: number; studentCount: number }> = {};

        // Initialize all colleges
        ALL_COLLEGES.forEach(college => {
            collegeBreakdown[college] = { amount: 0, studentCount: 0 };
        });

        // Count unique students who paid per college
        const paidStudentsByCollege: Record<string, Set<string>> = {};
        ALL_COLLEGES.forEach(college => {
            paidStudentsByCollege[college] = new Set();
        });

        // Staff Performance Breakdown
        const staffBreakdown: Record<string, { name: string; amount: number; transactionCount: number }> = {};



        transactions.forEach(tx => {
            // College Stats
            const rawCollege = tx.student.college;
            const group = mapToCollegeGroup(rawCollege);

            if (collegeBreakdown[group]) {
                collegeBreakdown[group].amount += parseFloat(tx.amountPaid.toString());
                paidStudentsByCollege[group].add(tx.student.id);
            }

            // Staff Stats
            const staffName = tx.staff ? tx.staff.name : 'Unknown Staff';
            if (!staffBreakdown[staffName]) {
                staffBreakdown[staffName] = { name: staffName, amount: 0, transactionCount: 0 };
            }
            staffBreakdown[staffName].amount += parseFloat(tx.amountPaid.toString());
            staffBreakdown[staffName].transactionCount += 1;


        });

        // Set student counts
        ALL_COLLEGES.forEach(college => {
            collegeBreakdown[college].studentCount = paidStudentsByCollege[college].size;
        });

        // Daily trend (last 7 days)
        const dailyTrend: { date: string; amount: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const dayTotal = transactions
                .filter(tx => {
                    const txDate = new Date(tx.createdAt);
                    return txDate >= date && txDate < nextDay;
                })
                .reduce((sum, tx) => sum + parseFloat(tx.amountPaid.toString()), 0);

            dailyTrend.push({
                date: date.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }),
                amount: dayTotal
            });
        }

        res.json({
            totalCollections,
            todayCollections,
            totalStudents: students.length,
            fullyPaid,
            partialPaid,
            packageBreakdown: { A: packageA, B: packageB, C: packageC },
            collegeBreakdown,
            staffBreakdown,

            dailyTrend
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

export default router;

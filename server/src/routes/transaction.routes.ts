import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logAudit } from './audit.routes';
import { io } from '../index';

const router = Router();
const prisma = new PrismaClient();

const PACKAGES = {
    'A': 265.00,
    'B': 1105.00,
    'C': 1255.00
};

// GET all transactions (Ledger)
router.get('/', async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            include: {
                student: true,
                staff: true
            },
            orderBy: { createdAt: 'desc' },
            where: { isVoid: false }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// POST create transaction
router.post('/', async (req, res) => {
    const {
        studentId, staffId, packageType, amountPaid, paymentMode, orNumber,
        newStudentDetails
    } = req.body;

    try {
        console.log('Received Payload:', req.body);
        console.log('New Student Details:', newStudentDetails);

        // 1. Find or Create Student
        let student = await prisma.student.findUnique({ where: { id: studentId } });

        if (!student) {
            if (!newStudentDetails) {
                return res.status(404).json({ error: 'Student ID not found. Please provide details to create new entry.' });
            }
            student = await prisma.student.create({
                data: {
                    id: studentId,
                    firstName: newStudentDetails.firstName,
                    lastName: newStudentDetails.lastName,
                    middleInitial: newStudentDetails.middleInitial || '',
                    college: newStudentDetails.college || 'N/A',
                    program: newStudentDetails.program || 'N/A',
                    yearLevel: parseInt(newStudentDetails.yearLevel) || 1,
                    section: newStudentDetails.section || 'N/A',
                    totalPaid: 0,
                    balance: 0,
                    paymentStatus: 'UNPAID'
                }
            });
        } else {
            // Student exists - Update details if provided
            if (newStudentDetails) {
                await prisma.student.update({
                    where: { id: studentId },
                    data: {
                        firstName: newStudentDetails.firstName,
                        lastName: newStudentDetails.lastName,
                        middleInitial: newStudentDetails.middleInitial || '',
                        college: newStudentDetails.college,
                        program: newStudentDetails.program,
                        yearLevel: parseInt(newStudentDetails.yearLevel) || 1,
                        section: newStudentDetails.section
                    }
                });
                // Re-fetch to get updated state for logic below
                student = await prisma.student.findUnique({ where: { id: studentId } });
            }
        }

        // 2. Concurrency Check
        // 2. Concurrency / Validation Check

        if (!student) {
            return res.status(500).json({ error: 'Student record could not be found or created' });
        }

        const isUpgrade = packageType && student.packageType && packageType !== student.packageType;

        if (student.paymentStatus === 'FULLY_PAID' && !isUpgrade) {
            return res.status(400).json({ error: 'Student is already Fully Paid. To add more payments, switch package.' });
        }

        // 3. Calculate Remaining Balance and Cap Amount
        const pkgPrice = PACKAGES[packageType as keyof typeof PACKAGES];
        const currentPaid = Number(student.totalPaid);
        const remainingBalance = Math.max(0, pkgPrice - currentPaid);

        // Cap the amount to the remaining balance (any excess is "change")
        const actualAmountApplied = Math.min(Number(amountPaid), remainingBalance);
        const currentTotalPaid = currentPaid + actualAmountApplied;

        let newStatus = 'PARTIAL';
        if (currentTotalPaid >= pkgPrice) {
            newStatus = 'FULLY_PAID';
        }

        const balance = Math.max(0, pkgPrice - currentTotalPaid);

        // 4. Create Transaction (with actual amount applied, not full amount with change)
        const transaction = await prisma.transaction.create({
            data: {
                studentId,
                staffId,
                amountPaid: actualAmountApplied,
                paymentMode,
                orNumber: orNumber,
                packageTypeSnapshot: packageType
            }
        });

        // 5. Update Student Record
        await prisma.student.update({
            where: { id: studentId },
            data: {
                totalPaid: currentTotalPaid,
                balance: balance,
                paymentStatus: newStatus as any,
                packageType: packageType
            }
        });

        // 7. Emit Real-time Update
        io.emit('ledger_update', { type: 'CREATE', transaction });

        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Transaction failed' });
    }
});

// Helper to verify Admin PIN
const verifyAdminPin = async (pin: string) => {
    if (!pin) return false;
    const admin = await prisma.staff.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) return false;
    return await bcrypt.compare(pin, admin.password);
};

// PUT update transaction (Requires Admin PIN)
router.put('/:id', async (req, res) => {
    const txId = parseInt(req.params.id);
    const { amountPaid, paymentMode, orNumber, packageType, staffId, adminPin } = req.body;

    try {
        console.log('EDIT Payload:', req.body);
        // Security Check
        const isPinValid = await verifyAdminPin(adminPin);
        if (!isPinValid) {
            return res.status(403).json({ error: 'Invalid or missing Admin PIN. Action denied.' });
        }

        const tx = await prisma.transaction.findUnique({
            where: { id: txId },
            include: { student: true }
        });

        if (!tx) return res.status(404).json({ error: 'Transaction not found' });

        // 1. Revert previous effect on student balance
        const oldAmount = Number(tx.amountPaid);
        const oldPkgPrice = PACKAGES[(tx.packageTypeSnapshot || 'A') as keyof typeof PACKAGES];

        // 2. Calculate new values
        const newAmount = Number(amountPaid);
        const newPkgPrice = PACKAGES[(packageType || tx.packageTypeSnapshot) as keyof typeof PACKAGES];

        // Update Transaction
        const updatedTx = await prisma.transaction.update({
            where: { id: txId },
            data: {
                amountPaid,
                paymentMode,
                orNumber,
                packageTypeSnapshot: packageType
            }
        });

        // 3. Recalculate Student Totals (Fetch all valid transactions to be safe)
        const allTxs = await prisma.transaction.findMany({
            where: { studentId: tx.studentId, isVoid: false }
        });

        const totalPaid = allTxs.reduce((sum: number, t: any) => sum + Number(t.amountPaid), 0);
        const balance = Math.max(0, newPkgPrice - totalPaid);
        const status = totalPaid >= newPkgPrice ? 'FULLY_PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID';

        await prisma.student.update({
            where: { id: tx.studentId },
            data: {
                totalPaid,
                balance,
                paymentStatus: status,
                packageType: packageType, // Update current package preference

                // Update Personal Details if provided
                firstName: req.body.updatedStudentDetails?.firstName,
                lastName: req.body.updatedStudentDetails?.lastName,
                middleInitial: req.body.updatedStudentDetails?.middleInitial,
                college: req.body.updatedStudentDetails?.college,
                program: req.body.updatedStudentDetails?.program,
                yearLevel: req.body.updatedStudentDetails?.yearLevel ? parseInt(req.body.updatedStudentDetails.yearLevel) : undefined,
                section: req.body.updatedStudentDetails?.section
            }
        });

        // Audit Log
        if (staffId) {
            await logAudit(staffId, 'EDIT', `Edited transaction #${txId} for student ${tx.studentId}`);
        }

        io.emit('ledger_update', { type: 'EDIT', transaction: updatedTx });
        res.json(updatedTx);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Update failed' });
    }
});

// DELETE void transaction (Requires Admin PIN)
router.delete('/:id', async (req, res) => {
    const txId = parseInt(req.params.id);
    const staffId = req.query.staffId ? parseInt(req.query.staffId as string) : 1;
    const adminPin = req.body.adminPin || req.query.adminPin; // Accept from body or query

    try {
        // Security Check
        const isPinValid = await verifyAdminPin(adminPin as string);
        if (!isPinValid) {
            return res.status(403).json({ error: 'Invalid or missing Admin PIN. Action denied.' });
        }

        const tx = await prisma.transaction.findUnique({
            where: { id: txId },
            include: { student: true }
        });

        if (!tx) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Mark as void
        await prisma.transaction.update({
            where: { id: txId },
            data: { isVoid: true }
        });

        // Recalculate student totals
        const remainingTxs = await prisma.transaction.findMany({
            where: { studentId: tx.studentId, isVoid: false }
        });

        const newTotalPaid = remainingTxs.reduce((sum: number, t: any) => sum + Number(t.amountPaid), 0);
        const pkgPrice = PACKAGES[(tx.packageTypeSnapshot || 'A') as keyof typeof PACKAGES];
        const newBalance = Math.max(0, pkgPrice - newTotalPaid);
        const newStatus = newTotalPaid >= pkgPrice ? 'FULLY_PAID' : newTotalPaid > 0 ? 'PARTIAL' : 'UNPAID';

        await prisma.student.update({
            where: { id: tx.studentId },
            data: {
                totalPaid: newTotalPaid,
                balance: newBalance,
                paymentStatus: newStatus
            }
        });

        // Log to audit
        await logAudit(staffId, 'VOID', `Voided transaction #${txId} for student ${tx.studentId}`);

        io.emit('ledger_update', { type: 'VOID', id: txId });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Void failed' });
    }
});

export default router;

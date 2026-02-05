import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const router = Router();
const prisma = new PrismaClient();

router.get('/csv', async (req, res) => {
    const staffId = req.query.staffId ? parseInt(req.query.staffId as string) : null;

    try {
        // Get staff details for signature
        let exportedBy = { name: 'Unknown', position: 'Unknown' };
        if (staffId) {
            const staff = await prisma.staff.findUnique({ where: { id: staffId } });
            if (staff) {
                exportedBy = { name: staff.name, position: staff.position };
            }
        }

        const transactions = await prisma.transaction.findMany({
            include: {
                student: true,
                staff: true
            },
            where: { isVoid: false },
            orderBy: [
                { student: { college: 'asc' } },
                { student: { program: 'asc' } },
                { createdAt: 'desc' }
            ]
        });

        // Group transactions by college
        const collegeMap: Record<string, typeof transactions> = {};
        transactions.forEach((tx) => {
            const college = tx.student.college;
            if (!collegeMap[college]) {
                collegeMap[college] = [];
            }
            collegeMap[college].push(tx);
        });

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = exportedBy.name;
        workbook.created = new Date();

        const exportDate = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });

        // Create a sheet for each college
        for (const [college, collegeTxs] of Object.entries(collegeMap)) {
            // Sort by program within each college
            const sortedTxs = collegeTxs.sort((a, b) =>
                a.student.program.localeCompare(b.student.program)
            );

            const sheet = workbook.addWorksheet(college);

            // Header info
            sheet.addRow(['TANGLAW Yearbook 2026 - Payment Collection Report']);
            sheet.addRow([`Exported By: ${exportedBy.name}`]);
            sheet.addRow([`Position: ${exportedBy.position}`]);
            sheet.addRow([`Date/Time: ${exportDate}`]);
            sheet.addRow([`College: ${college}`]);
            sheet.addRow([]);

            // Column headers (removed College column)
            const headerRow = sheet.addRow([
                'Transaction ID',
                'Student ID',
                'Student Name',
                'Program',
                'Package',
                'Amount Paid',
                'Balance',
                'Mode',
                'OR Number',
                'Status',
                'Staff',
                'Date',
                'Time'
            ]);

            // Style header row
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF283329' }
            };
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

            // Add data rows
            sortedTxs.forEach((tx) => {
                const date = new Date(tx.createdAt).toLocaleDateString('en-PH');
                const time = new Date(tx.createdAt).toLocaleTimeString('en-PH', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });

                sheet.addRow([
                    tx.id,
                    tx.studentId,
                    `${tx.student.firstName} ${tx.student.lastName}`,
                    tx.student.program,
                    tx.packageTypeSnapshot || '-',
                    parseFloat(tx.amountPaid.toString()),
                    parseFloat(tx.student.balance.toString()),
                    tx.paymentMode,
                    tx.orNumber,
                    tx.student.paymentStatus,
                    tx.staff.name,
                    date,
                    time
                ]);
            });

            // Auto-fit columns
            sheet.columns.forEach((column) => {
                column.width = 15;
            });
            sheet.getColumn(3).width = 25; // Student Name
            sheet.getColumn(4).width = 20; // Program
        }

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment(`tanglaw_collection_${new Date().toISOString().split('T')[0]}.xlsx`);
        res.send(buffer);

    } catch (error) {
        console.error(error);
        res.status(500).send('Export failed');
    }
});

export default router;

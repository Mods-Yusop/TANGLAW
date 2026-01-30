import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Derive a 32-byte key from the secret
function getEncryptionKey(): Buffer {
    const secret = process.env.SESSION_SECRET || 'default-secret-key-change-me';
    return crypto.createHash('sha256').update(secret).digest();
}

// Encrypt data
function encrypt(data: string): Buffer {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: IV (16) + AuthTag (16) + Ciphertext
    return Buffer.concat([iv, authTag, encrypted]);
}

// Decrypt data
function decrypt(encryptedBuffer: Buffer): string {
    const key = getEncryptionKey();

    // Extract parts
    const iv = encryptedBuffer.subarray(0, IV_LENGTH);
    const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
}

// POST /api/session/save - Export encrypted session
router.post('/save', async (req, res) => {
    try {
        // Collect all data
        const students = await prisma.student.findMany();
        const transactions = await prisma.transaction.findMany({
            include: { student: true, staff: true }
        });
        const staff = await prisma.staff.findMany({
            select: { id: true, name: true, position: true, username: true, role: true }
        });

        const sessionData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            data: {
                students,
                transactions,
                staff
            }
        };

        // Serialize and encrypt
        const jsonData = JSON.stringify(sessionData);
        const encryptedBuffer = encrypt(jsonData);

        // Send as downloadable file
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', 'attachment; filename="tanglaw_session.mysession"');
        res.send(encryptedBuffer);

    } catch (error) {
        console.error('Session save error:', error);
        res.status(500).json({ error: 'Failed to save session' });
    }
});

// POST /api/session/import - Import encrypted session
router.post('/import', async (req, res) => {
    try {
        // The express.raw() middleware puts the Buffer in req.body
        const encryptedBuffer = req.body as Buffer;

        if (!encryptedBuffer || encryptedBuffer.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
            return res.status(400).json({ error: 'Invalid file format or empty file' });
        }

        // Decrypt
        let sessionData;
        try {
            const decryptedJson = decrypt(encryptedBuffer);
            sessionData = JSON.parse(decryptedJson);
        } catch (decryptError) {
            console.error('Decryption failed:', decryptError);
            return res.status(400).json({
                error: 'File is corrupted or has been tampered with'
            });
        }

        // Validate structure
        if (!sessionData.version || !sessionData.data) {
            return res.status(400).json({ error: 'Invalid session file structure' });
        }

        // Clear existing data and restore
        await prisma.$transaction(async (tx) => {
            // Delete in order (respect foreign keys)
            await tx.transaction.deleteMany();
            await tx.auditLog.deleteMany();
            await tx.student.deleteMany();
            await tx.staff.deleteMany();

            // Restore staff (without passwords - they need to be re-hashed)
            for (const s of sessionData.data.staff) {
                await tx.staff.create({
                    data: {
                        id: s.id,
                        name: s.name,
                        position: s.position,
                        username: s.username,
                        password: '$2b$10$placeholder', // Placeholder - admin should reset
                        role: s.role
                    }
                });
            }

            // Restore students
            for (const student of sessionData.data.students) {
                await tx.student.create({
                    data: {
                        id: student.id,
                        firstName: student.firstName,
                        middleInitial: student.middleInitial,
                        lastName: student.lastName,
                        college: student.college,
                        program: student.program,
                        yearLevel: student.yearLevel,
                        section: student.section,
                        packageType: student.packageType,
                        totalPaid: student.totalPaid,
                        balance: student.balance,
                        paymentStatus: student.paymentStatus
                    }
                });
            }

            // Restore transactions
            for (const txn of sessionData.data.transactions) {
                await tx.transaction.create({
                    data: {
                        id: txn.id,
                        studentId: txn.studentId,
                        staffId: txn.staffId,
                        amountPaid: txn.amountPaid,
                        paymentMode: txn.paymentMode,
                        orNumber: txn.orNumber,
                        packageTypeSnapshot: txn.packageTypeSnapshot,
                        isVoid: txn.isVoid,
                        createdAt: new Date(txn.createdAt)
                    }
                });
            }
        });

        res.json({
            success: true,
            message: 'Session restored successfully',
            stats: {
                students: sessionData.data.students.length,
                transactions: sessionData.data.transactions.length,
                staff: sessionData.data.staff.length
            }
        });

    } catch (error) {
        console.error('Session import error:', error);
        res.status(500).json({ error: 'Failed to import session' });
    }
});

export default router;

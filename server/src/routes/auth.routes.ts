import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'tanglaw-secret-key';

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const staff = await prisma.staff.findUnique({
            where: { username }
        });

        if (!staff) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isValid = await bcrypt.compare(password, staff.password);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: staff.id, name: staff.name, position: staff.position, role: staff.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Set HttpOnly Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Requires HTTPS (enabled in index.ts)
            sameSite: 'none', // Allow cross-site (if needed for dev) or 'strict'
            maxAge: 8 * 60 * 60 * 1000 // 8 hours
        });

        res.json({
            // token, // Do not send token in body anymore
            staff: {
                id: staff.id,
                name: staff.name,
                position: staff.position,
                role: staff.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    res.json({ success: true });
});

// POST /api/auth/verify-pin (Admin PIN check)
router.post('/verify-pin', async (req, res) => {
    const { pin } = req.body;

    try {
        // Find an Admin user and check if PIN matches their password
        const admin = await prisma.staff.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!admin) {
            return res.status(500).json({ error: 'No Admin configured' });
        }

        const isValid = await bcrypt.compare(pin, admin.password);

        if (isValid) {
            res.json({ success: true, adminName: admin.name });
        } else {
            res.status(401).json({ error: 'Invalid Admin PIN' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

// GET /api/auth/me - Get current user from token
router.get('/me', async (req, res) => {
    // Read from Cookie
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'No authorized session' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const staff = await prisma.staff.findUnique({
            where: { id: decoded.id },
            select: { id: true, name: true, position: true, role: true }
        });

        if (!staff) {
            return res.status(401).json({ error: 'Staff not found' });
        }

        res.json({ staff });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;

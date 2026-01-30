import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // 1. Create Admin Staff
    const adminPassword = await bcrypt.hash('tanglaw2026', 10);
    const staffPassword = await bcrypt.hash('staff123', 10);

    const admin = await prisma.staff.upsert({
        where: { username: 'eic' },
        update: {},
        create: {
            name: 'Editor In Chief',
            position: 'EIC',
            username: 'eic',
            password: adminPassword,
            role: 'ADMIN'
        }
    });

    // Generic Staff (Keep existing)
    const staff = await prisma.staff.upsert({
        where: { username: 'staff' },
        update: {},
        create: {
            name: 'Staff Generic',
            position: 'Staff',
            username: 'staff',
            password: staffPassword,
            role: 'STAFF'
        }
    });

    // 2. Create Named Staff Accounts (Generated from User Request)
    const newStaff = [
        { name: 'Mariel P. Madayag', position: 'Associate Editor', username: 'mariel.madayag' },
        { name: 'Mary Adeline L. Sagayno', position: 'Managing Editor', username: 'mary.sagayno' },
        { name: 'Jay Gumaso', position: 'Layout Artist', username: 'jay.gumaso' },
        { name: 'Kirk Darrell Eonhil R. Soriano', position: 'Layout Artist', username: 'kirk.soriano' },
        { name: 'Kevin Kyle C. Redondiez', position: 'Layout Artist', username: 'kevin.redondiez' },
        { name: 'Jan Roy Untalan', position: 'Layout Artist', username: 'jan.untalan' },
        { name: 'Joshua Agrabio', position: 'Layout Artist', username: 'joshua.agrabio' }
    ];

    const defaultPassword = await bcrypt.hash('tanglaw2026', 10);

    for (const s of newStaff) {
        await prisma.staff.upsert({
            where: { username: s.username },
            update: {},
            create: {
                name: s.name,
                position: s.position,
                username: s.username,
                password: defaultPassword,
                role: 'STAFF'
            }
        });
    }

    console.log({ admin, staff });

    // 2. Refresh Student Data (ARO List)
    const students = [
        { id: '21-10452', firstName: 'Juan', middleInitial: 'A', lastName: 'Cruz', college: 'CASS', program: 'BS Criminology', yearLevel: 4, section: 'A' },
        { id: '20-09231', firstName: 'Maria', middleInitial: 'B', lastName: 'Santos', college: 'CEIT', program: 'BS Civil Eng', yearLevel: 5, section: 'C' },
        { id: '21-11567', firstName: 'Ahmed', middleInitial: 'K', lastName: 'Hassan', college: 'IMEAS', program: 'BA Islamic Studies', yearLevel: 4, section: 'A' },
        { id: '20-00123', firstName: 'Sarah', middleInitial: 'L', lastName: 'Lim', college: 'CHS', program: 'BS Nursing', yearLevel: 4, section: 'B' },
        { id: '21-33451', firstName: 'Mark', middleInitial: 'D', lastName: 'Garcia', college: 'CEIT', program: 'BS Computer Sci', yearLevel: 4, section: 'A' },
        { id: '20-22109', firstName: 'Fatima', middleInitial: 'S', lastName: 'Abdullah', college: 'CBDEM', program: 'BS Accountancy', yearLevel: 5, section: 'A' },
        { id: '20-11882', firstName: 'Jose', middleInitial: 'P', lastName: 'Reyes', college: 'CSM', program: 'BS Biology', yearLevel: 5, section: 'B' },
        { id: '22-05671', firstName: 'Ana', middleInitial: 'M', lastName: 'Dizon', college: 'CHEFS', program: 'BS Tourism Mgmt', yearLevel: 4, section: 'C' },
        { id: '20-40912', firstName: 'Ibrahim', middleInitial: 'T', lastName: 'Pendatun', college: 'CA', program: 'BS Agriculture', yearLevel: 6, section: 'B' },
        { id: '21-15678', firstName: 'Elena', middleInitial: 'R', lastName: 'Torres', college: 'CED', program: 'B Elem Educ', yearLevel: 4, section: 'A' },
        { id: '20-29001', firstName: 'Michael', middleInitial: 'J', lastName: 'Tan', college: 'CVM', program: 'Doctor of Veterinary Medicine', yearLevel: 6, section: 'A' },
        { id: '21-12345', firstName: 'Bea', middleInitial: 'C', lastName: 'Alonzo', college: 'CTI', program: 'BS Industrial Tech', yearLevel: 4, section: 'B' },
        { id: '20-08765', firstName: 'Paolo', middleInitial: 'V', lastName: 'Mercado', college: 'MEDICINE', program: 'Doctor of Medicine', yearLevel: 5, section: 'A' },
        { id: '22-09876', firstName: 'Aisha', middleInitial: 'G', lastName: 'Omar', college: 'CASS', program: 'BA Psychology', yearLevel: 4, section: 'C' },
        { id: '20-34567', firstName: 'Romer', middleInitial: 'E', lastName: 'Diaz', college: 'CHK', program: 'B Physical Educ', yearLevel: 5, section: 'A' },
        { id: '20-45678', firstName: 'Carla', middleInitial: 'F', lastName: 'Gomez', college: 'CEIT', program: 'BS Info Systems', yearLevel: 6, section: 'B' },
        { id: '21-56789', firstName: 'Zaid', middleInitial: 'H', lastName: 'Malik', college: 'CSM', program: 'BS Chemistry', yearLevel: 4, section: 'A' },
        { id: '21-67890', firstName: 'Lito', middleInitial: 'N', lastName: 'Lapid', college: 'CBDEM', program: 'BS Agribusiness', yearLevel: 4, section: 'C' },
        { id: '20-78901', firstName: 'Grace', middleInitial: 'Q', lastName: 'Poe', college: 'CHEFS', program: 'BS Hospital Mgmt', yearLevel: 5, section: 'B' },
        { id: '22-89012', firstName: 'Ben', middleInitial: 'S', lastName: 'Tulfo', college: 'CASS', program: 'BA PolSci', yearLevel: 4, section: 'A' },
        { id: '20-90123', firstName: 'Camille', middleInitial: 'W', lastName: 'Villar', college: 'IMEAS', program: 'BS International Relations', yearLevel: 6, section: 'A' },
        { id: '21-01234', firstName: 'Sandro', middleInitial: 'Y', lastName: 'Marcos', college: 'CEIT', program: 'BS Agri & Biosystems Eng', yearLevel: 5, section: 'B' },
        { id: '21-13579', firstName: 'Riza', middleInitial: 'Z', lastName: 'Hontiveros', college: 'CHS', program: 'BS Nursing', yearLevel: 4, section: 'C' },
        { id: '20-24680', firstName: 'Bong', middleInitial: 'X', lastName: 'Go', college: 'CA', program: 'BS Fisheries', yearLevel: 5, section: 'A' },
        { id: '21-35791', firstName: 'Imee', middleInitial: 'U', lastName: 'Manotoc', college: 'CED', program: 'B Secondary Educ', yearLevel: 4, section: 'B' },
        { id: '20-46802', firstName: 'Kiko', middleInitial: 'I', lastName: 'Pangilinan', college: 'CSM', program: 'BS Applied Math', yearLevel: 6, section: 'A' },
        { id: '21-57913', firstName: 'Leni', middleInitial: 'O', lastName: 'Robredo', college: 'CBDEM', program: 'BS Business Admin', yearLevel: 4, section: 'A' },
        { id: '21-68024', firstName: 'Isko', middleInitial: 'P', lastName: 'Moreno', college: 'CTI', program: 'B Technical Vocational Teacher Educ', yearLevel: 4, section: 'B' },
        { id: '20-79135', firstName: 'Manny', middleInitial: 'A', lastName: 'Pacquiao', college: 'CHK', program: 'BS Exercise & Sports Sci', yearLevel: 5, section: 'C' },
        { id: '22-80246', firstName: 'Ping', middleInitial: 'S', lastName: 'Lacson', college: 'CVM', program: 'BS Vet Tech', yearLevel: 4, section: 'A' },
        { id: '20-91357', firstName: 'Ralph', middleInitial: 'D', lastName: 'Recto', college: 'MEDICINE', program: 'Doctor of Medicine', yearLevel: 6, section: 'A' },
        { id: '21-02468', firstName: 'Loren', middleInitial: 'F', lastName: 'Legarda', college: 'CASS', program: 'BA English Lang', yearLevel: 4, section: 'B' }
    ];

    console.log(`Seeding ${students.length} students...`);

    // CLEANUP: Wipe all transactions first to ensure clean slate
    await prisma.transaction.deleteMany({});
    // Optional: Wipe all students if you want to remove manually added ones. 
    // For now, let's keep it creating/updating the list, but we must ensure their balances are reset.
    // Actually, to "remove the inputs", deleting all students and re-creating is safer.
    await prisma.student.deleteMany({});

    for (const s of students) {
        await prisma.student.create({
            data: {
                id: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
                college: s.college,
                program: s.program,
                yearLevel: s.yearLevel,
                section: s.section,
                totalPaid: 0,
                balance: 265, // Default for Package A
                paymentStatus: 'UNPAID',
                packageType: 'A'
            }
        });
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

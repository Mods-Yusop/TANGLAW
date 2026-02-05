
import XLSX from 'xlsx';
import path from 'path';

const accountsPath = path.join(__dirname, 'data', 'Accounts.xlsx');
try {
    const workbook = XLSX.readFile(accountsPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    const user = data.find(u => u.Username === 'kevin.redondiez');
    if (user) {
        console.log(`Found user: ${user.Username}`);
        console.log(`Raw Password in Excel: "${user.Password}"`); // Quotes to reveal spaces
    } else {
        console.log('User not found in Excel.');
    }
} catch (e) {
    console.error('Error reading Excel:', e);
}

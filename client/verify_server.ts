import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function main() {
    console.log('--- STARTING VERIFICATION ---');

    // 1. Login
    console.log('1. Logging in...');
    let token = '';
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            username: 'eic',
            password: 'tanglaw2026'
        });
        token = res.data.token;
        console.log('   Login Successful. Token obtained.');
    } catch (e: any) {
        console.error('   Login Failed:', e.response?.data || e.message);
        return;
    }

    const authConfig = {
        headers: { Authorization: `Bearer ${token}` }
    };

    // 2. Search Student
    console.log('2. Search Student (22-31054)...');
    try {
        const res = await axios.get(`${API_URL}/students/search?q=22-31054`, authConfig);
        const student = res.data.find((s: any) => s.id === '22-31054');
        if (student) {
            console.log(`   Found: ${student.firstName} ${student.lastName}, Balance: ${student.balance}`);
        } else {
            console.error('   Student not found!');
        }
    } catch (e: any) {
        console.error('   Search Failed:', e.message);
    }

    // 3. Create Transaction (Partial)
    console.log('3. Create Transaction (Pay 100)...');
    let tx1Id = 0;
    try {
        const res = await axios.post(`${API_URL}/transactions`, {
            studentId: '22-31054',
            staffId: 1,
            packageType: 'A',
            amountPaid: 100,
            paymentMode: 'CASH',
            orNumber: 'OR-001'
        }, authConfig);
        tx1Id = res.data.id;
        console.log(`   Transaction Created. ID: ${tx1Id}`);
    } catch (e: any) {
        console.error('   Create Failed:', e.response?.data || e.message);
    }

    // 4. Verify Balance
    console.log('4. Verify Balance (Should be 165)...');
    await checkBalance('22-31054', 165, authConfig);

    // 5. Add Payment (Full)
    console.log('5. Add Payment (Pay 165)...');
    let tx2Id = 0;
    try {
        const res = await axios.post(`${API_URL}/transactions`, {
            studentId: '22-31054',
            staffId: 1,
            packageType: 'A',
            amountPaid: 165,
            paymentMode: 'CASH',
            orNumber: 'OR-002'
        }, authConfig);
        tx2Id = res.data.id;
        console.log(`   Transaction Created. ID: ${tx2Id}`);
    } catch (e: any) {
        console.error('   Create Failed:', e.response?.data || e.message);
    }

    // 6. Verify Balance
    console.log('6. Verify Balance (Should be 0)...');
    await checkBalance('22-31054', 0, authConfig);

    // 7. Edit Transaction (Change 165 to 65)
    console.log('7. Edit Transaction (Change 165 -> 65)...');
    try {
        await axios.put(`${API_URL}/transactions/${tx2Id}`, {
            amountPaid: 65,
            staffId: 1
        }, authConfig);
        console.log('   Update Successful.');
    } catch (e: any) {
        console.error('   Update Failed:', e.response?.data || e.message);
    }

    // 8. Verify Balance
    console.log('8. Verify Balance (Should be 100)...');
    await checkBalance('22-31054', 100, authConfig);

    // 9. Void Transaction
    console.log('9. Void Transaction...');
    try {
        await axios.delete(`${API_URL}/transactions/${tx2Id}`, authConfig);
        console.log('   Void Successful.');
    } catch (e: any) {
        console.error('   Void Failed:', e.response?.data || e.message);
    }

    // 10. Verify Balance
    console.log('10. Verify Balance (Should be 165)...');
    await checkBalance('22-31054', 165, authConfig);

    console.log('--- VERIFICATION COMPLETE ---');
}

async function checkBalance(studentId: string, expected: number, config: any) {
    try {
        const res = await axios.get(`${API_URL}/students/search?q=${studentId}`, config);
        const student = res.data.find((s: any) => s.id === studentId);
        if (student) {
            console.log(`   Balance: ${student.balance} (Expected: ${expected})`);
            if (Number(student.balance) == expected) {
                console.log('   [PASS] Balance Correct');
            } else {
                console.log('   [FAIL] Balance Incorrect');
            }
        }
    } catch (e: any) {
        console.error('   Check Balance Failed:', e.message);
    }
}

main();

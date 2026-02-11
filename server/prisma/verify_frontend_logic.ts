
// Mock of App.tsx Data
const COLLEGE_PROGRAMS: Record<string, string[]> = {
    "CASS": [
        "Bachelor of Science in Criminology (BSCriminology)",
        "Bachelor of Arts in English Language (ABEnglish)",
        "Bachelor of Arts in Psychology (ABPsych)",
        "Bachelor of Arts in Political Science (ABPolSci)",
        "Bachelor of Science in Development Communication (BSDC)",
        "Bachelor of Arts in Philosophy (ABPhilos)"
    ],
    "CASS - Libungan Campus": [
        "Bachelor of Science in Criminology (BSCrim Libungan)"
    ],
    "CASS - Mlang Campus": [
        "Bachelor of Science in Criminology (BSCrim Mlang)"
    ],
    "CBDEM": [
        "Bachelor of Science in Accountancy (BSAccnty)",
        "Bachelor of Science in Agribusiness (BSAgriBus)",
        "Bachelor of Science in Agricultural Economics (BSAgEcon)",
        "Bachelor of Science in Business Administration (BSBA)",
        "Bachelor of Public Administration (BPAd)",
        "Bachelor of Science in Management Accounting (BSMA)"
    ],
    "CBDEM - Libungan Campus": [
        "Bachelor of Science in Business Administration (BSBA Libungan)"
    ],
    "CHEFS": [
        "Bachelor of Science in Food Technology (BSFT)",
        "Bachelor of Science in Hospitality Management (BSHM)",
        "Bachelor of Science in Nutrition and Dietetics (BSND)",
        "Bachelor of Science in Tourism Management (BSTM)"
    ],
    "CHEFS - Libungan": [
        "Bachelor of Science in Hospitality Management (BSHM-Libungan)"
    ],
    "CA": [
        "Certificate in Agricultural Science (2nd year BSA)",
        "Bachelor of Science in Agriculture (BSA)",
        "Bachelor of Science in Agricultural Technology (BSAgriTech)",
        "Bachelor of Science in Fisheries (BSF)"
    ],
    "CA - Libungan Campus": [
        "Bachelor of Science in Agriculture (BSA - Libungan)"
    ],
    "CHS": [
        "BS Pharmacy (BS Pharmacy)",
        "Diploma of Midwifery",
        "Bachelor of Science in Nursing (BSN)"
    ],
    "IMEAS": [
        "Bachelor of Arts in Islamic Studies (BAIS)",
        "Bachelor of Science in International Relations (BSIR)"
    ],
    "CHK": [
        "Bachelor of Physical Education (BPE)",
        "Bachelor of Science in Exercise and Sports Sciences (BSESS)"
    ],
    "CED": [
        "Bachelor of Elementary Education (BEED)",
        "Bachelor of Secondary Education (BSE)"
    ],
    "CED - Libungan Campus": [
        "Bachelor of Secondary Education (BSE - Libungan)"
    ],
    "CED - Aleosan Campus": [
        "Bachelor of Elementary Education (BEED - Aleosan)"
    ],
    "CVM": [
        "Doctor of Veterinary Medicine (DVM)",
        "BS Veterinary Technology (BS Vet Tech)"
    ],
    "CVM - Aleosan Campus": [
        "BS Veterinary Technology (BS Vet Tech Aleosan)"
    ],
    "CTI": [
        "Bachelor of Science in Industrial Technology (BSIT)",
        "Bachelor of Technical-Vocational Teacher Education (BTVTEd)"
    ],
    "MED": [
        "Doctor of Medicine"
    ],
    "COL": [
        "Juris Doctor"
    ]
};

const COLLEGE_LIST = Object.keys(COLLEGE_PROGRAMS);
const COLLEGES = ['All Colleges', ...COLLEGE_LIST];

const COLLEGE_SYNONYMS: Record<string, string> = {
    'CBDEM-LC': 'CBDEM',
    'CASS-LC': 'CASS',
    'CA-LC': 'CA',
    'CHEFS-LC': 'CHEFS',
    'CED-LC': 'CED',
    'CVM-AL': 'CVM',
    'CED-AL': 'CED',
    'GS': 'Graduate School'
};

const normalizeCollege = (c: string) => COLLEGE_SYNONYMS[c] || c;

function testMatch(studentId: string, dbCollege: string, dbProgram: string) {
    console.log(`Testing Student ${studentId}: College='${dbCollege}', Program='${dbProgram}'`);

    let matchedCollege = dbCollege;
    if (!COLLEGES.includes(matchedCollege)) {
        matchedCollege = normalizeCollege(matchedCollege);
        if (!COLLEGES.includes(matchedCollege)) {
            const potentialMatch = COLLEGES.find(c => c.includes(matchedCollege) || matchedCollege.includes(c) || (matchedCollege.includes('Libungan') && c.includes('Libungan')));
            if (potentialMatch) matchedCollege = potentialMatch;
        }
    }
    console.log(`-> Normalized College: '${matchedCollege}'`);

    let matchedProgram = dbProgram;
    const availablePrograms = COLLEGE_PROGRAMS[matchedCollege] || [];
    console.log(`-> Available Programs Count: ${availablePrograms.length}`);

    // 1. Try exact match
    const pExact = availablePrograms.find(p => p === matchedProgram);

    // 2. Try match by Abbreviation (if DB has 'BSBA' and List has '... (BSBA)')
    const pAbbr = availablePrograms.find(p => {
        const match = p.match(/\(([^)]+)\)/);
        return match && match[1] === matchedProgram;
    });

    // 3. Try match by start/inclusion (fuzzy)
    const pFuzzy = availablePrograms.find(p => p.toLowerCase().includes(matchedProgram.toLowerCase()) || matchedProgram.toLowerCase().includes(p.toLowerCase()));

    const finalProgram = pExact || pAbbr || pFuzzy || matchedProgram;
    console.log(`-> Final Program: '${finalProgram}'`);
    console.log(`-> Match Type: ${pExact ? 'Exact' : pAbbr ? 'Abbr' : pFuzzy ? 'Fuzzy' : 'None/Fallback'}`);
    console.log('-----------------------------------');
}

// Test Cases based on DB Check
testMatch('22-00166', 'CBDEM', 'BSMA'); // Should work
testMatch('22-24111', 'CBDEM', 'Bachelor of Science in Business Administration'); // Should work (Fuzzy)
testMatch('22-92802', 'CHK', 'BSESS'); // Should work
testMatch('22-XXX', 'CBDEM-LC', 'BSBA'); // Should work (Normalize -> CBDEM -> BSBA match)
testMatch('22-YYY', 'CBDEM', 'Unknown Program'); // Should Fallback

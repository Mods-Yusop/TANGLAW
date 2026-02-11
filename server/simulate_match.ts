
import fs from 'fs';
import path from 'path';

const colleges = JSON.parse(fs.readFileSync('colleges_dump.json', 'utf8'));
const chsPrograms = colleges.filter((row: any) => row[0] === 'CHS').map((row: any) => row[1]);

console.log('CHS Programs in App:', chsPrograms);

const targetProgram = "BSN"; // Value from DB for 20-40012

console.log('Target Program from DB:', targetProgram);

// Function from App.tsx (Robust Match)
function findProgram(matchedProgram: string, availablePrograms: string[]) {
    // 1. Try exact match
    const pExact = availablePrograms.find(p => p === matchedProgram);
    if (pExact) return { type: 'Exact', value: pExact };

    // 2. Try match by Abbreviation (Robust)
    const pAbbr = availablePrograms.find(p => {
        const match = p.match(/\(([^)]+)\)/);
        if (match) {
            const acronym = match[1].trim();
            const target = (matchedProgram || '').trim();
            // console.log(`Comparing: "${acronym}" vs "${target}"`);
            return acronym === target || acronym.toLowerCase() === target.toLowerCase();
        }
        return false;
    });
    if (pAbbr) return { type: 'Abbr', value: pAbbr };

    // 3. Try match by start/inclusion (fuzzy)
    const pFuzzy = availablePrograms.find(p => {
        const val = (matchedProgram || '').toLowerCase().trim();
        const opt = p.toLowerCase();
        return opt.includes(val) || val.includes(opt);
    });
    if (pFuzzy) return { type: 'Fuzzy', value: pFuzzy };

    return { type: 'None', value: null };
}

const testCases = [
    "BSN",
    "BSN ",
    " BSN",
    "bsn",
    "Bachelor of Science in Nursing (BSN)",
    "Bachelor of Science in Nursing",
    "BS Pharmacy"
];

const cassPrograms = colleges.find((row: any) => row[0] === 'CASS').slice(1); // CASS row
// Actually colleges dump format is [ ["CASS", "Prog1"], ["CASS", "Prog2"] ]
const cassProgramsList = colleges.filter((row: any) => row[0] === 'CASS').map((row: any) => row[1]);

console.log('CASS Programs:', cassProgramsList);

const testCases2 = [
    "ABPhilos",
    "ABPhilos ",
    "Bachelor of Arts in Philosophy (ABPhilos)"
];

testCases2.forEach(tc => {
    const result = findProgram(tc, cassProgramsList);
    console.log(`Testing "${tc}":`, result);
});

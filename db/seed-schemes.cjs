const postgres = require('postgres');

async function seedSchemes() {
    const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartfarm';
    const sql = postgres(url);
    console.log('Connected to DB');

    // First clear old/expired schemes
    await sql`DELETE FROM schemes`;

    const newSchemes = [
        {
            title: 'PM-Kisan Samman Nidhi',
            description: 'Financial benefit of ₹6000 per year in three equal installments to all landholding farmers.',
            category: 'financial',
            benefit: '₹6000 / year',
            eligibility: 'All landholding farmers',
            deadline: new Date('2025-12-31'),
            documentRequired: 'Aadhaar, Bank Account, Land records',
            applicationLink: 'https://pmkisan.gov.in/',
            image: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=400',
            isActive: true,
            isNew: true,
            color: '#4CAF50'
        },
        {
            title: 'PM-KUSUM Scheme',
            description: 'Subsidies for setting up standalone solar pumps and solarization of existing grid-connected agriculture pumps.',
            category: 'equipment',
            benefit: 'Up to 60% subsidy',
            eligibility: 'Individual farmers, groups, co-operatives',
            deadline: new Date('2026-03-31'),
            documentRequired: 'Aadhaar, Land docs, Bank details',
            applicationLink: 'https://pmkusum.mnre.gov.in/',
            image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400',
            isActive: true,
            isNew: true,
            color: '#F9A825'
        },
        {
            title: 'Agriculture Infrastructure Fund (AIF)',
            description: 'Medium-long term debt financing facility for investment in viable projects for post-harvest management.',
            category: 'financial',
            benefit: '3% Interest Subvention',
            eligibility: 'Farmers, FPOs, PACs',
            deadline: new Date('2027-01-01'),
            documentRequired: 'DPR, KYC documents, Land records',
            applicationLink: 'https://agriinfra.dac.gov.in/',
            image: 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=400',
            isActive: true,
            isNew: true,
            color: '#0277BD'
        },
        {
            title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
            description: 'Provides insurance coverage and financial support to farmers in the event of crop failure.',
            category: 'insurance',
            benefit: 'Crop insurance cover',
            eligibility: 'All farmers growing notified crops',
            deadline: new Date('2025-07-31'),
            documentRequired: 'Aadhaar, Land records, Sowing certificate',
            applicationLink: 'https://pmfby.gov.in/',
            image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400',
            isActive: true,
            isNew: false,
            color: '#E65100'
        }
    ];

    for (const s of newSchemes) {
        await sql`INSERT INTO schemes (title, description, category, benefit, eligibility, deadline, "documentRequired", "applicationLink", image, "isActive", "isNew", color, "createdAt", "updatedAt")
             VALUES (${s.title}, ${s.description}, ${s.category}, ${s.benefit}, ${s.eligibility}, ${s.deadline}, ${s.documentRequired}, ${s.applicationLink}, ${s.image}, ${s.isActive}, ${s.isNew}, ${s.color}, NOW(), NOW())`;
        console.log('Inserted scheme:', s.title);
    }

    await sql.end();
    console.log('Schemes updated successfully!');
}

seedSchemes().catch(console.error);

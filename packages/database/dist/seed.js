"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@sahakar/database");
const prisma = new database_1.PrismaClient();
async function main() {
    console.log('Seeding initial data...');
    const testUsers = [
        { email: 'vipeesh.purchase.sahakar@gmail.com', name: 'Vipeesh', role: 'PROCUREMENT_HEAD' },
        { email: 'frpboy12@gmail.com', name: 'Rahul', role: 'SUPER_ADMIN' },
        { email: 'sahakarhoit@gmail.com', name: 'Zabnix', role: 'SUPER_ADMIN' },
        { email: 'ashiqmohammedmannarppil@gmail.com', name: 'Ashiq', role: 'ADMIN' },
        { email: 'sarath.purchase.sahakar@gmail.com', name: 'Sarath', role: 'ADMIN' },
        { email: 'abhi.billinghead.sahakar@gmail.com', name: 'Abhi', role: 'BILLING_HEAD' },
        { email: 'sujeev.billing.sahakar@gmail.com', name: 'Sujeev', role: 'BILLING_STAFF' },
        { email: 'shafi.billing.sahakar@gmail.com', name: 'Shafi', role: 'BILLING_STAFF' },
    ];
    for (const u of testUsers) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: { role: u.role, name: u.name, active: true },
            create: {
                email: u.email,
                name: u.name,
                role: u.role,
                active: true
            }
        });
    }
    console.log('Seeding complete.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map
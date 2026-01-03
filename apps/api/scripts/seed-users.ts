import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

// Define UserRole enum matching the database schema
enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    PROCUREMENT_HEAD = 'PROCUREMENT_HEAD',
    PURCHASE_STAFF = 'PURCHASE_STAFF',
    BILLING_HEAD = 'BILLING_HEAD',
    BILLING_STAFF = 'BILLING_STAFF',
}

const prisma = new PrismaClient();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

interface UserData {
    email: string;
    name: string;
    role: UserRole;
    password: string;
}

const users: UserData[] = [
    // Purchase Staff
    {
        email: 'drisya.purchase.sahakar@gmail.com',
        name: 'Drisya',
        role: 'PURCHASE_STAFF',
        password: 'R8@dQ7!MZxP2#c',
    },
    {
        email: 'jamsheera.purchase.sahakar@gmail.com',
        name: 'Jamsheera',
        role: 'PURCHASE_STAFF',
        password: 'K!4sWQ9@b#2LrZ',
    },
    {
        email: 'sujitha.purchase.sahakar@gmail.com',
        name: 'Sujitha',
        role: 'PURCHASE_STAFF',
        password: 'ZC#8@wM!5L2R9',
    },

    // Billing Head
    {
        email: 'abhi.billinghead.sahakar@gmail.com',
        name: 'Abhi',
        role: 'BILLING_HEAD',
        password: '@9KZr!5C7W2#b',
    },

    // Billing Staff
    {
        email: 'sujeev.billing.sahakar@gmail.com',
        name: 'Sujeev',
        role: 'BILLING_STAFF',
        password: 'B7!@MZC9#2rW5',
    },
    {
        email: 'shafi.billing.sahakar@gmail.com',
        name: 'Shafi',
        role: 'BILLING_STAFF',
        password: '#C5Z!9W7@2MrB',
    },
    {
        email: 'shiji.billing.sahakar@gmail.com',
        name: 'Shiji',
        role: 'BILLING_STAFF',
        password: '9@#B7ZC!5WMr2',
    },
    {
        email: 'vivek.billing.sahakar@gmail.com',
        name: 'Vivek',
        role: 'BILLING_STAFF',
        password: 'Z!C@9#7W2MBr5',
    },
    {
        email: 'jalvan.billing.sahakar@gmail.com',
        name: 'Jalvan',
        role: 'BILLING_STAFF',
        password: '@WZ9#7!B2CMr5',
    },
    {
        email: 'suhail.billing.sahakar@gmail.com',
        name: 'Suhail',
        role: 'BILLING_STAFF',
        password: '5Z@#C9!7WM2Br',
    },
    {
        email: 'fayis.billing.sahakar@gmail.com',
        name: 'Fayis',
        role: 'BILLING_STAFF',
        password: '7!Z@C#9WMB2r5',
    },

    // Admin
    {
        email: 'ashiqmohammedmannarppil@gmail.com',
        name: 'Ashiq',
        role: 'ADMIN',
        password: '@9C7Z!W#2MB5r',
    },
    {
        email: 'sarath.purchase.sahakar@gmail.com',
        name: 'Sarath',
        role: 'ADMIN',
        password: 'Z#@7C!9WMB2r5',
    },

    // Super Admin
    {
        email: 'frpboy12@gmail.com',
        name: 'Rahul',
        role: 'SUPER_ADMIN',
        password: 'C9Z@#7!WMB2r5',
    },
    {
        email: 'sahakarhoit@gmail.com',
        name: 'Zabnix',
        role: 'SUPER_ADMIN',
        password: '@ZC9#7!WMB2r5',
    },
    {
        email: 'zabnixprivatelimited@gmail.com',
        name: 'Zabnix Corp',
        role: 'SUPER_ADMIN',
        password: '7Z@C9#!WMB2r5',
    },

    // Procurement Head
    {
        email: 'vipeesh.purchase.sahakar@gmail.com',
        name: 'Vipeesh',
        role: 'PROCUREMENT_HEAD',
        password: '!ZC@9#7WMB2r5',
    },
];

async function createUserInFirebase(userData: UserData) {
    try {
        // Check if user already exists
        try {
            const existingUser = await admin.auth().getUserByEmail(userData.email);
            console.log(`✓ User ${userData.email} already exists in Firebase (UID: ${existingUser.uid})`);
            return existingUser.uid;
        } catch (error: any) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }

        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.name,
            emailVerified: true, // Auto-verify for testing
        });

        console.log(`✓ Created Firebase user: ${userData.email} (UID: ${userRecord.uid})`);
        return userRecord.uid;
    } catch (error) {
        console.error(`✗ Failed to create Firebase user ${userData.email}:`, error);
        throw error;
    }
}

async function createUserInDatabase(userData: UserData, firebaseUid: string) {
    try {
        // Check if user already exists in database
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (existingUser) {
            console.log(`✓ User ${userData.email} already exists in database`);
            return existingUser;
        }

        // Create user in database
        const user = await prisma.user.create({
            data: {
                firebaseUid,
                email: userData.email,
                displayName: userData.name,
                role: userData.role,
            },
        });

        console.log(`✓ Created database user: ${userData.email} (Role: ${userData.role})`);
        return user;
    } catch (error) {
        console.error(`✗ Failed to create database user ${userData.email}:`, error);
        throw error;
    }
}

async function seedUsers() {
    console.log('🌱 Starting user seed process...\n');
    console.log(`📊 Total users to create: ${users.length}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const userData of users) {
        try {
            console.log(`\n📝 Processing: ${userData.name} (${userData.email})`);

            // Create in Firebase
            const firebaseUid = await createUserInFirebase(userData);

            // Create in Database
            await createUserInDatabase(userData, firebaseUid);

            successCount++;
            console.log(`✅ Successfully processed ${userData.name}`);
        } catch (error) {
            errorCount++;
            console.error(`❌ Failed to process ${userData.name}:`, error);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SEED SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📈 Total: ${users.length}`);
    console.log('='.repeat(60));

    // Display user breakdown by role
    console.log('\n👥 USER BREAKDOWN BY ROLE:');
    const roleCounts = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`   ${role}: ${count}`);
    });
}

// Run the seed function
seedUsers()
    .catch((error) => {
        console.error('❌ Seed process failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log('\n✓ Database connection closed');
    });

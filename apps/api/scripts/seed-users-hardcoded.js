const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Hardcoded service account to bypass JSON parsing issues
const serviceAccount = {
    "type": "service_account",
    "project_id": "sahakar-ppo",
    "private_key_id": "39ef755029b7fe0199cf428db722415b4447097c",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCrGPqO20RyEcNt\noYet9D1oJsiYx7mSRuuimUdKffIPSLXpMmskgmVCGrphXsYvnlfu9TOiWpGTYXiz\nmcgv5sabwzBJOfJZSlYXJGTTaHoL1M6nksBOPX4RX/chd6Lzu1sVRO85F2k/vbMy\n9BfT3LbFO+g36IGT6F9AkK6nN8hp3dyVmAK3JNjFI9RSfsgXTbKTb8sdNtB9NtL8\nh+Z04PWoitvIUSxsbxjC/ntJ2z+4g/wl/3cUVIwLwRMJ+P6cARK7ksuNb5d8DLRC\nfFVddnE14Zk/GTpFZnnUAonGS0VuXumcgfJY1kOztX4nKxkWJad4F4JYKONbnUDX\nuQOu+d47AgMBAAECggEACy6Q1XxHPvmiBYyy4tYDzpMJgh6ipjvKhsmXF96Fggub\nXYTrhqsBwu4fQMgIxZaG70ZVwqZCCr+qIhOKh0LnhC+F/NfzwQ0mjwQHlaxBNnu8\nEJL6zKigXOW7yRNzpWBlvzNoCDNByb/A/rMzYw4mLcHqcJjz7jHK49vXMw6zI0pl\nLWFpeXIk2jD1v6RZkOq5g7kw2olOnypd1fXWbJvwI5gAObDXMBem1ryB8SUbtADq\n5gIj99qJoY/s3r+eJ1QEvtFzJlTnQ5Y8dyQhx1hs+Y99P7nSG5IYQUlybkYN6kGz\ndcYW2bA2vpb5WZthBF7xaQYO1EDJtWkIXm2pU0fiOQKBgQDXs+aLc6BI8iT0Vv8j\nRdKcuL+Kek7GHGxZU5pQp2xFAj7PhUXw6RjrQNWgPDSVu+gCYl9WS7Kk/Q+AookE\nljiasOt0EbbrekuMdnuevZnfAZtMtRojF4vIP8Or0Cz4Tiu+2xifCjgUxoD7/KCj\nDCdcnvN6gNG7YYF9Q7erlwgeAwKBgQDLD8/u6E7aUC098L8BWxnvBNmK9uWzN6n9\ngqvHkGjB0c6dJnznaLNqsgtcTu9AZZBVFbqbg+7EdnBNJPZQqwlI7ELSo9qGmPdS\nWrWU4TnAQfVDNUTDHpCksZ3HyRtLp6AUGrFOA0lEMszJnbo70HYYmIN5Tre3b8HA\nfYk1qFqFaQKBgDrbyS4GSBd/k5vk3Uvnspe3RfToePRQLzSUvogBl2ahPThtOm+J\ne5Y+I8zMgODW3HFCHJe0ojOpJgDI2TCaOSnk2uraJprMzS6v6f2f6QvUKWdeB5rJ\wwfKdn88l/jNg9xZdrd3F2R74hhgkAjNuTPp37Bu1EwYSDhBMS4uUTW3AoGAQNzO\nKJwgA/A0Y2KxQHefMxAzhQYUnUicjhPdVyOzsqWX/+65WxnApcY1hsjX95P5pJQK\nRX7BGBRVDu9NlrrrflWpiqs4NGJMLgw3kFTZI6Zt94febQ0oWtM5eQWuKF5k7ccQ\n98Bo+NXZQFWXlV+jOXwOEwOn/3o9Q4VV/MPIFnECgYBfqOj0ElUESsLANBj1xFpe\n4glqJPzXL7S48MeoOqZijCXk/WLyetwGTQDFyLGmuY85DuH9R+PdtmhD+CEiwU8W\ngQvLvn5Ey47U9MiCkjdsdbXc7+dY43d5ZYhqe2ggpR5hAGMlmsdR3uX00QjgDDl7\nH9t5j2k+egyXo611ErdSmQ==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@sahakar-ppo.iam.gserviceaccount.com",
    "client_id": "109363560192676133048",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40sahakar-ppo.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
};

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized successfully\n');
}

const users = [
    // Purchase Staff
    { email: 'drisya.purchase.sahakar@gmail.com', name: 'Drisya', role: 'PURCHASE_STAFF', password: 'R8@dQ7!MZxP2#c' },
    { email: 'jamsheera.purchase.sahakar@gmail.com', name: 'Jamsheera', role: 'PURCHASE_STAFF', password: 'K!4sWQ9@b#2LrZ' },
    { email: 'sujitha.purchase.sahakar@gmail.com', name: 'Sujitha', role: 'PURCHASE_STAFF', password: 'ZC#8@wM!5L2R9' },

    // Billing Head
    { email: 'abhi.billinghead.sahakar@gmail.com', name: 'Abhi', role: 'BILLING_HEAD', password: '@9KZr!5C7W2#b' },

    // Billing Staff
    { email: 'sujeev.billing.sahakar@gmail.com', name: 'Sujeev', role: 'BILLING_STAFF', password: 'B7!@MZC9#2rW5' },
    { email: 'shafi.billing.sahakar@gmail.com', name: 'Shafi', role: 'BILLING_STAFF', password: '#C5Z!9W7@2MrB' },
    { email: 'shiji.billing.sahakar@gmail.com', name: 'Shiji', role: 'BILLING_STAFF', password: '9@#B7ZC!5WMr2' },
    { email: 'vivek.billing.sahakar@gmail.com', name: 'Vivek', role: 'BILLING_STAFF', password: 'Z!C@9#7W2MBr5' },
    { email: 'jalvan.billing.sahakar@gmail.com', name: 'Jalvan', role: 'BILLING_STAFF', password: '@WZ9#7!B2CMr5' },
    { email: 'suhail.billing.sahakar@gmail.com', name: 'Suhail', role: 'BILLING_STAFF', password: '5Z@#C9!7WM2Br' },
    { email: 'fayis.billing.sahakar@gmail.com', name: 'Fayis', role: 'BILLING_STAFF', password: '7!Z@C#9WMB2r5' },

    // Admin
    { email: 'ashiqmohammedmannarppil@gmail.com', name: 'Ashiq', role: 'ADMIN', password: '@9C7Z!W#2MB5r' },
    { email: 'sarath.purchase.sahakar@gmail.com', name: 'Sarath', role: 'ADMIN', password: 'Z#@7C!9WMB2r5' },

    // Super Admin
    { email: 'frpboy12@gmail.com', name: 'Rahul', role: 'SUPER_ADMIN', password: 'C9Z@#7!WMB2r5' },
    { email: 'sahakarhoit@gmail.com', name: 'Zabnix', role: 'SUPER_ADMIN', password: '@ZC9#7!WMB2r5' },
    { email: 'zabnixprivatelimited@gmail.com', name: 'Zabnix Corp', role: 'SUPER_ADMIN', password: '7Z@C9#!WMB2r5' },

    // Procurement Head
    { email: 'vipeesh.purchase.sahakar@gmail.com', name: 'Vipeesh', role: 'PROCUREMENT_HEAD', password: '!ZC@9#7WMB2r5' },
];

async function createUserInFirebase(userData) {
    try {
        try {
            const existingUser = await admin.auth().getUserByEmail(userData.email);
            console.log(`✓ User ${userData.email} already exists in Firebase (UID: ${existingUser.uid})`);
            return existingUser.uid;
        } catch (error) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }

        const userRecord = await admin.auth().createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.name,
            emailVerified: true,
        });

        console.log(`✓ Created Firebase user: ${userData.email} (UID: ${userRecord.uid})`);
        return userRecord.uid;
    } catch (error) {
        console.error(`✗ Failed to create Firebase user ${userData.email}:`, error.message);
        throw error;
    }
}

async function createUserInDatabase(userData, firebaseUid) {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (existingUser) {
            console.log(`✓ User ${userData.email} already exists in database`);
            return existingUser;
        }

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
        console.error(`✗ Failed to create database user ${userData.email}:`, error.message);
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

            const firebaseUid = await createUserInFirebase(userData);
            await createUserInDatabase(userData, firebaseUid);

            successCount++;
            console.log(`✅ Successfully processed ${userData.name}`);
        } catch (error) {
            errorCount++;
            console.error(`❌ Failed to process ${userData.name}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SEED SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📈 Total: ${users.length}`);
    console.log('='.repeat(60));

    const roleCounts = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
    }, {});

    console.log('\n👥 USER BREAKDOWN BY ROLE:');
    Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`   ${role}: ${count}`);
    });
}

seedUsers()
    .catch((error) => {
        console.error('❌ Seed process failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log('\n✓ Database connection closed');
    });

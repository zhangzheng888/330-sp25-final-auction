const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/user.model.js'); // Adjust path if your models are elsewhere

// Load environment variables. Assuming .env is in the server/ directory for this script.
// If you run this script from the root, you might need to adjust the path.
dotenv.config({ path: './.env' });

const createSuperAdmin = async () => {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('Error: MONGODB_URI is not defined in your .env file.');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('DB connection successful for seeding!');

        const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@example.com';
        const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'superadminpassword';
        const superAdminUsername = process.env.SUPERADMIN_USERNAME || 'superadmin';

        const existingSuperAdmin = await User.findOne({ email: superAdminEmail });

        if (existingSuperAdmin) {
            console.log(`Superadmin with email ${superAdminEmail} already exists.`);
        } else {
            await User.create({
                email: superAdminEmail,
                password: superAdminPassword, // Password will be hashed by the pre-save hook
                role: 'superadmin',
                username: superAdminUsername,
                // leagueId can be null or not present for a superadmin
            });
            console.log(`Superadmin account created successfully for ${superAdminEmail}.`);
        }
    } catch (error) {
        console.error('Error during superadmin seed operation:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('DB disconnected after seeding.');
    }
};

createSuperAdmin(); 
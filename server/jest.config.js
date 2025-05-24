module.exports = {
    // testEnvironment: '@shelf/jest-mongodb/environment',
    preset: '@shelf/jest-mongodb', // preset includes the environment
    setupFilesAfterEnv: ['./jest.setup.js'],
    // globalSetup: '@shelf/jest-mongodb/setup', // Handled by preset or environment
    // globalTeardown: '@shelf/jest-mongodb/teardown', // Handled by preset or environment
    watchPathIgnorePatterns: ['globalConfig'], // often useful if jest-mongodb writes a config file
    testTimeout: 30000, // Increase timeout for DB operations if needed
    // If you're using the mongodbMemoryServerOptions directly in this file (as you had it):
    // mongodbMemoryServerOptions: {
    //     binary: {
    //         version: '8.0.6', // Specify a version if needed, or let it use the default
    //         skipMD5: true
    //     },
    //     autoStart: true, // Ensure it starts automatically
    //     instance: {
    //         dbName: 'jest' // Default DB name for tests
    //     }
    // },
    // To avoid the Jest validation warning, you might need to put mongodbMemoryServerOptions
    // in a separate jest-mongodb-config.js or ensure @shelf/jest-mongodb handles it internally
    // when using testEnvironment. For now, keeping it here as per your previous setup.
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageReporters: ["json", "lcov", "text", "clover"],
    // Add any other Jest configurations you need, like moduleNameMapper, transform, etc.
};

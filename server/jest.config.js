module.exports = {
    preset: '@shelf/jest-mongodb',
    testEnvironment: 'node',
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageProvider: 'v8', // or 'babel'
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    setupFilesAfterEnv: ['./jest.setup.js'], // Correct path relative to jest.config.js location
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ],
    // Optional: If you face issues with mongodb-memory-server, you might need this
    // globalSetup: '@shelf/jest-mongodb/setup.js',
    // globalTeardown: '@shelf/jest-mongodb/teardown.js',
    // testEnvironmentOptions: {
    //     uri: process.env.MONGO_URI, // This uses the URI from jest-mongodb-config
    // },
    // mongodbMemoryServerOptions: { // As discussed, this was a point of iteration
    //   binary: {
    //     version: '6.0.4', // Specify your MongoDB version
    //     skipMD5: true,
    //   },
    //   autoStart: false, // we manually start it in jest.setup.js
    //   instance: {},
    // },
};

module.exports = {
    roots: ['<rootDir>/src'],
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    coverageReporters: ['lcov', 'text', 'cobertura'],
    reporters: ['default', 'jest-junit'],
    coveragePathIgnorePatterns: ['interfaces'],
    coverageThreshold: {
        './src': {
            branches: 100,
            functions: 100,
            lines: 100,
        },
    },
    collectCoverageFrom: [
        './src/**/*.ts',
    ],
};

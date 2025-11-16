// Test setup file
// This runs before all tests

// Setup test environment variables
// Use a separate test database
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || './data/nazaritor.test.db'
process.env.NODE_ENV = 'test'

console.log('Test environment initialized')
console.log('Test database:', process.env.DATABASE_URL)

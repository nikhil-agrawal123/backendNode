const crypto = require('crypto');
const fs = require('fs');

// Generate a secure random secret
const secret = crypto.randomBytes(32).toString('hex');

console.log('Generated Session Secret:');
console.log(secret);
console.log('\nAdd this to your .env file:');
console.log(`SESSION_SECRET=${secret}`);

// Optionally write to .env file (be careful not to overwrite existing content)
const envContent = `
# Session Configuration
SESSION_SECRET=${secret}
`;

console.log('\n✅ Copy the SESSION_SECRET line above to your .env file');

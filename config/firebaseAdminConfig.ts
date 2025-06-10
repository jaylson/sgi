import * as admin from 'firebase-admin';

// IMPORTANT: Replace with the actual path to your service account key JSON file
// or load from an environment variable.
// Ensure this file is NOT committed to your repository.
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || './serviceAccountKey.json';

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('Firebase Admin SDK initialized successfully.');

} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.log('Ensure your service account key is correctly placed and configured, and the path is correct.');
  console.log('The service account key file (e.g., serviceAccountKey.json) should be in the project root or the path specified by FIREBASE_SERVICE_ACCOUNT_KEY_PATH environment variable.');
}

export default admin;

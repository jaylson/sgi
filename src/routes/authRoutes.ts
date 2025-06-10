import { Router, Request, Response } from 'express';
import admin from '../../config/firebaseAdminConfig'; // Adjusted path
import db from '../database'; // Adjusted path
import bcrypt from 'bcrypt'; // For potential future local password hashing

const router = Router();

// Registration Endpoint
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // 1. Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName, // Optional: pass if provided
    });

    // 2. Store user info in local SQLite database
    const stmt = db.prepare('INSERT INTO users (firebase_uid, email) VALUES (?, ?)');
    stmt.run(userRecord.uid, userRecord.email, function (err) {
      if (err) {
        // It's possible the user was created in Firebase but failed to save locally.
        // Production apps need robust error handling here, e.g., cleanup Firebase user or retry.
        console.error('Error saving user to local DB:', err.message);
        // Potentially delete the Firebase user if local DB save fails critically
        // await admin.auth().deleteUser(userRecord.uid);
        return res.status(500).json({ error: 'Error creating user locally.' });
      }
      console.log(`User ${userRecord.email} registered and saved locally with ID: ${this.lastID}`);
      res.status(201).json({
        message: 'User registered successfully!',
        uid: userRecord.uid,
        email: userRecord.email,
      });
    });
    stmt.finalize();

  } catch (error: any) {
    console.error('Error creating new user in Firebase:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already in use.' });
    }
    res.status(500).json({ error: 'Failed to register user.', details: error.message });
  }
});

// Login Endpoint (primarily for verifying Firebase ID token and creating a session if needed)
router.post('/login', async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'Firebase ID token is required.' });
  }

  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Optionally, you could fetch additional user details from your local DB if needed
    db.get('SELECT email, firebase_uid FROM users WHERE firebase_uid = ?', [uid], (err, row) => {
      if (err) {
        console.error('Error fetching user from local DB:', err.message);
        return res.status(500).json({ error: 'Error fetching user data.' });
      }
      if (!row) {
        // This case might happen if user authenticated with Firebase but isn't in local DB
        // (e.g. if registration process was interrupted or they were created via Firebase console)
        // You might want to create a local record here, or handle as an error.
        console.warn(`User with UID ${uid} authenticated with Firebase but not found in local DB.`);
        // For now, just return Firebase data.
      }

      // At this point, the user is authenticated with Firebase.
      // You could generate a custom session token (JWT) here if you want to manage sessions
      // independently from Firebase ID tokens for subsequent requests.
      // For this example, we'll just confirm verification.
      res.status(200).json({
        message: 'User authenticated successfully via Firebase.',
        uid: uid,
        email: decodedToken.email,
        // localData: row // Uncomment if you want to send back local DB data
      });
    });

  } catch (error: any) {
    console.error('Error verifying Firebase ID token:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Firebase ID token has expired. Please re-authenticate.' });
    }
    if (error.code === 'auth/argument-error') {
        return res.status(401).json({ error: 'Invalid Firebase ID token.'});
    }
    res.status(401).json({ error: 'Failed to authenticate user.', details: error.message });
  }
});

export default router;

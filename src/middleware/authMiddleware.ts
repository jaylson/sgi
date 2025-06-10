import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebaseAdminConfig'; // Adjusted path

export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

export const verifyFirebaseToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided or incorrect format.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Add user info to the request object
    next();
  } catch (error: any) {
    console.error('Error verifying Firebase ID token in middleware:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Unauthorized: Firebase ID token has expired.' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid Firebase ID token.' });
  }
};

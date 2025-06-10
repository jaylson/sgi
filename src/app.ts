import express, { Request, Response } from 'express'; // Consolidated imports
import '../config/firebaseAdminConfig'; // Initialize Firebase Admin
import './database'; // Initialize SQLite database

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Import auth middleware
import { verifyFirebaseToken, AuthenticatedRequest } from './middleware/authMiddleware';

// Example protected route
app.get('/api/homepage', verifyFirebaseToken, (req: AuthenticatedRequest, res: Response) => {
  // req.user contains the decoded Firebase token (uid, email, etc.)
  res.json({
    message: `Welcome to the homepage, ${req.user?.email || req.user?.uid}! This is protected content.`,
    user: req.user
  });
});

// Import and use auth routes
import authRoutes from './routes/authRoutes';
app.use('/api/auth', authRoutes);

// A simple test route
app.get('/api/hello', (req: Request, res: Response) => { // Added Request type for consistency
  res.json({ message: 'Hello from the backend!' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export default app;

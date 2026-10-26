import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  initDb,
  isDbConnected,
  upsertGoogleUser,
  getUserById,
  getPlayerSave,
  savePlayerSave,
  recordMatchHistory,
  getRecentMatches,
  deleteUserAccountData,
} from './src/server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'clashofpens_jwt_secret_key_32_chars_local';
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Initialize database
initDb().catch((err) => {
  console.warn('Database initialization warning:', err.message);
});

// Authentication middleware
interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.cop_session;
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, SESSION_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.clearCookie('cop_session');
    next();
  }
}

app.use(authMiddleware);

// --- API ROUTES ---

// 1. Current user session status
app.get('/api/me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.json({
        authenticated: false,
        isDbConnected,
      });
    }

    const user = await getUserById(req.userId);
    if (!user) {
      res.clearCookie('cop_session');
      return res.json({ authenticated: false, isDbConnected });
    }

    const save = await getPlayerSave(user.id);

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        googleSub: user.google_sub,
      },
      save,
      isDbConnected,
    });
  } catch (err: any) {
    console.error('Error fetching /api/me:', err);
    return res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

// 2. Google Sign-In verification & session generation
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { credential, profile } = req.body;
    if (!credential && !profile) {
      return res.status(400).json({ error: 'Missing Google credentials' });
    }

    let sub = '';
    let name = 'Clash Player';
    let picture = '';

    // If Google JWT token was provided, decode safely
    if (credential) {
      const decoded = jwt.decode(credential) as any;
      if (decoded && decoded.sub) {
        sub = decoded.sub;
        name = decoded.name || decoded.given_name || 'Clash Player';
        picture = decoded.picture || '';
      }
    }

    // Direct profile fallback if client supplied parsed OAuth profile
    if (!sub && profile && profile.sub) {
      sub = profile.sub;
      name = profile.name || name;
      picture = profile.picture || picture;
    }

    if (!sub) {
      return res.status(400).json({ error: 'Invalid Google token payload' });
    }

    const user = await upsertGoogleUser(sub, name, picture);
    const save = await getPlayerSave(user.id);

    // Issue HTTP-only secure cookie
    const token = jwt.sign({ userId: user.id }, SESSION_SECRET, { expiresIn: '30d' });
    res.cookie('cop_session', token, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
      },
      save,
      isDbConnected,
    });
  } catch (err: any) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// 3. Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('cop_session');
  return res.json({ success: true });
});

// 4. Retrieve cloud save
app.get('/api/save', async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required for cloud save' });
  }

  try {
    const save = await getPlayerSave(req.userId);
    return res.json({ save, isDbConnected });
  } catch (err: any) {
    console.error('Fetch save error:', err);
    return res.status(500).json({ error: 'Failed to retrieve cloud save' });
  }
});

// 5. Update cloud save with revision control
app.put('/api/save', async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required to save progress' });
  }

  try {
    const result = await savePlayerSave(req.userId, req.body);
    if (!result.success) {
      return res.status(409).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    console.error('Update save error:', err);
    return res.status(500).json({ error: 'Failed to save progress to cloud' });
  }
});

// 6. Match history
app.get('/api/matches', async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const matches = await getRecentMatches(req.userId, limit);
    return res.json({ matches });
  } catch (err: any) {
    console.error('Match history fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve match history' });
  }
});

app.post('/api/matches', async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const record = await recordMatchHistory(req.userId, req.body);
    return res.json({ success: true, match: record });
  } catch (err: any) {
    console.error('Match record error:', err);
    return res.status(500).json({ error: 'Failed to record match' });
  }
});

// 7. Delete account data
app.delete('/api/account', async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    await deleteUserAccountData(req.userId);
    res.clearCookie('cop_session');
    return res.json({ success: true, message: 'Account data deleted successfully' });
  } catch (err: any) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Failed to delete account data' });
  }
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`ClashOfPens server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

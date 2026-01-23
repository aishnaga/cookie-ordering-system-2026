import session from 'express-session';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'spicewoodgstroop40203!';
const isProduction = process.env.NODE_ENV === 'production';

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'cookie-troop-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  proxy: isProduction,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

export const requireAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

export const loginAdmin = (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
};

export const logoutAdmin = (req, res) => {
  req.session.destroy();
  res.json({ success: true });
};

export const checkAdmin = (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
};

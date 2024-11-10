// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  let token = req.headers.authorization;

  console.log('Header Authorization:', token); // Debugging

  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  } else {
    console.error('Tokenul lipsește sau nu începe cu Bearer');
    return res.status(401).json({ message: 'Nu ești autentificat' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    console.error('Eroare la middleware-ul de autentificare:', error);
    res.status(401).json({ message: 'Token invalid' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acces interzis' });
    }
    next();
  };
};
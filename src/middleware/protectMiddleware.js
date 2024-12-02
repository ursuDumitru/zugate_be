import jwt from 'jsonwebtoken';


const protectMiddleware = (req, res, next) => {
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

export default protectMiddleware;

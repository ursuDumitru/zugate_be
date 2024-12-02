import User from '../../models/User.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Verificăm dacă utilizatorul există
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credențiale invalide' });
        }

        // Verificăm parola
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credențiale invalide' });
        }

        // Creăm payload-ul pentru token
        const payload = {
            user: {
                id: user._id,
                role: user.role,
            },
        };

        // Generăm token-ul JWT
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Returnăm token-ul și numele utilizatorului
        res.json({ token, name: user.name });
    } catch (error) {
        console.error('Eroare la autentificare:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default loginUser;
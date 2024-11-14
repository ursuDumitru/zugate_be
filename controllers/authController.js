    // controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Class from '../models/Class.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, className, subject } = req.body;

    // Verificăm dacă utilizatorul există deja
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email deja folosit' });
    }

    // Criptarea parolei
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crearea utilizatorului
    user = new User({
      name,
      email,
      passwordHash,
      role,
    });

    if (role === 'student') {
      // Găsim sau creăm clasa
      let studentClass = await Class.findOne({ name: className });
      if (!studentClass) {
        studentClass = new Class({ name: className });
        await studentClass.save();
      }
      user.class = studentClass._id;
      // Adăugăm elevul în lista clasei
      studentClass.students.push(user._id);
      await studentClass.save();
    } else if (role === 'teacher') {
      user.subject = subject;
    }

    await user.save();

    // Generarea token-ului JWT
    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token });
  } catch (error) {
    console.error('Eroare la înregistrare:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

export const loginUser = async (req, res) => {
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

    // Generăm token-ul JWT
    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Returnăm token-ul și numele utilizatorului
    res.json({ token, name: user.name });
  } catch (error) {
    console.error('Eroare la autentificare:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};
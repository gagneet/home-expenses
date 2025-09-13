import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '../models/user';
import { User } from '../types/user';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set');
}
const JWT_SECRET = process.env.JWT_SECRET;

const generateErrorId = () => uuidv4();

// Register a new user
router.post('/register', async (req, res) => {
  const { email, password, username, first_name, last_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser: Omit<User, 'id'> = { email, password_hash, username, first_name, last_name };
    const user = await createUser(newUser);

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    const errorId = generateErrorId();
    console.error(`Error registering user (ID: ${errorId}):`, {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Error registering user', error_id: errorId });
  }
});

// Login a user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ token });
  } catch (error) {
    const errorId = generateErrorId();
    console.error(`Error logging in (ID: ${errorId}):`, {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Error logging in', error_id: errorId });
  }
});

export default router;

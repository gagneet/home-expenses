import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createUser, findUserByEmail } from '../../../../lib/server/models/user';
import { User } from '../../../../lib/server/types/user';
import { v4 as uuidv4 } from 'uuid';
import { validatePassword } from '../../../../lib/server/utils';

const generateErrorId = () => uuidv4();

export async function POST(request: Request) {
  const { email, password, username, first_name, last_name } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return NextResponse.json({ message: passwordValidation.message }, { status: 400 });
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser: Omit<User, 'id'> = { email, password_hash, username, first_name, last_name };
    const user = await createUser(newUser);

    return NextResponse.json({ message: 'User created successfully', userId: user.id }, { status: 201 });
  } catch (error) {
    const errorId = generateErrorId();
    console.error(`Error registering user (ID: ${errorId}):`, {
      email,
      error: error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { message: String(error) },
      timestamp: new Date().toISOString()
    });
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Error registering user', error_id: errorId }, { status: 500 });
  }
}

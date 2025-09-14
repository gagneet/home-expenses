import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { findUserById } from '../../../../lib/server/models/user';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET() {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable must be set');
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = await findUserById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't send the password hash to the client
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

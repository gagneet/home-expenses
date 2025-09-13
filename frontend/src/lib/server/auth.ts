import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set');
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthenticatedRequest extends NextRequest {
  user?: { userId: string; email: string };
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      const authReq = req as AuthenticatedRequest;
      authReq.user = decoded;
      return handler(authReq);
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  };
}

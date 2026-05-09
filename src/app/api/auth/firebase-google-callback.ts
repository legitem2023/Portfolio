// pages/api/auth/firebase-google-callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-this';

interface FirebaseUserData {
  email: string;
  name: string | null;
  googleId: string;
  image: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, googleId, image }: FirebaseUserData = req.body;

  // Validate required fields
  if (!email || !googleId) {
    return res.status(400).json({ error: 'Email and Google ID are required' });
  }

  try {
    // Find or create user in your database
    let user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      // Create new user if doesn't exist
      user = await prisma.user.create({
        data: {
          email: email,
          name: name || email.split('@')[0],
          // @ts-ignore - Add googleId field to your Prisma schema if needed
          googleId: googleId,
          image: image || null,
          role: 'USER',
          phone: '', // Add default values for required fields
          addresses: [], // Add default addresses if needed
        },
      });
      console.log('✅ New user created via Firebase:', user.email);
    } else {
      // Update existing user with Google info if missing
      await prisma.user.update({
        where: { email: email },
        data: {
          // @ts-ignore - Update googleId if your schema has it
          googleId: user.googleId || googleId,
          image: user.image || image || null,
          name: user.name || name || email.split('@')[0],
        },
      });
      console.log('✅ Existing user logged in via Firebase:', user.email);
    }

    // Generate your app's JWT token (matching your existing token format)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        // Add any other fields your decryptToken expects
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Determine redirect based on role (matching your existing logic)
    let redirectUrl = '/';
    if (user.role === 'ADMINISTRATOR' || user.role === 'MANAGER') {
      redirectUrl = '/Management';
    } else if (user.role === 'RIDER') {
      redirectUrl = '/Rider';
    } else if (user.role === 'USER') {
      redirectUrl = '/';
    }

    res.status(200).json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
      redirectUrl: redirectUrl,
    });
    
  } catch (error: any) {
    console.error('Firebase auth callback error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}

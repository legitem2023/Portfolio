import { format } from 'date-fns'
import { PrismaClient } from '@prisma/client'

import bcrypt from 'bcrypt';
/**
 * Hashes a plain text password using bcrypt.
 * @param plainPassword - The password to encrypt
 * @param saltRounds - Optional, defaults to 10
 * @returns A bcrypt hash of the password
 */
export async function encryptPassword(plainPassword: string, saltRounds: number = 10): Promise<string> {
  if (!plainPassword) {
    throw new Error("Password is required for encryption.");
  }

  const hashed = await bcrypt.hash(plainPassword, saltRounds);
  return hashed;
}

export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  if (!plainPassword || !hashedPassword) {
    throw new Error("Both plain and hashed passwords are required for comparison.");
  }

  return await bcrypt.compare(plainPassword, hashedPassword);
}




const prisma = new PrismaClient()


export async function generateTrackingNumber(userId:string): Promise<string> {
  // Get today's date at 00:00:00
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Use this for the tracking number string only
  const dateStr = format(today, 'yyMMdd');
 // Get user's default address zipCode
  const user = await prisma.address.findMany({
    where: { 
      userId: userId,
      isDefault: true
    },
    select: { zipCode: true }
  });
  
  // Handle case where no default address exists
  const zipCode = user?.zipCode || '00000';
  
  // Use `today` (Date object) directly in the database
  const trackingCounter = await prisma.trackingCounter.upsert({
    where: { date: today },
    update: { counter: { increment: 1 } },
    create: { date: today, counter: 1 }
  });

 // const paddedCounter = trackingCounter.counter.toString().padStart(6, '0');
  const paddedCounter = (trackingCounter.counter || 0).toString().padStart(6, '0');
  return `TRK-${zipCode}-${dateStr}-${paddedCounter}`;
}


export async function generateOrderNumber(userId: string): Promise<string> {
  // Get today's date at midnight for consistent grouping
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Format date as YYMMDD (6 digits)
  const dateStr = format(today, 'yyMMdd');
  
  // Get user's default address zipCode
  const user = await prisma.address.findMany({
    where: { 
      userId: userId,
      isDefault: true
    },
    select: { zipCode: true }
  });
  
  // Handle case where no default address exists
  const zipCode = user?.zipCode || '00000';
  
  // Use date string for tracking instead of Date object
  // This avoids timezone issues with MongoDB
  const trackingCounter = await prisma.trackingCounter.upsert({
    where: { date: dateStr }, // Use string date instead of Date object
    update: { counter: { increment: 1 } },
    create: { date: dateStr, counter: 1 }
  });

  // Ensure counter is always 6 digits (padded with leading zeros)
  const paddedCounter = trackingCounter.counter.toString().padStart(6, '0');
  
  // Format: ORD-ZIPCODE-YYMMDD-000001
  return `ORD-${zipCode}-${dateStr}-${paddedCounter}`;
}



// calculateDistanceInKm.ts

export function calculateDistanceInKm(
  picklat: number,
  picklon: number,
  riderlat: number,
  riderlon: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371; // Earth radius in kilometers
  const dLat = toRad(riderlat - picklat);
  const dLon = toRad(riderlon - picklon);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(picklat)) * Math.cos(toRad(riderlat)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

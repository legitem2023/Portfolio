import { jwtDecrypt } from 'jose';

/**
 * Decrypts a JWE token using the provided secret
 * @param token - The encrypted JWE string
 * @param secretString - Your 256-bit secret (must be exactly 32 characters)
 * @returns Decoded payload
 */
export async function decryptToken(token: string, secretString: string): Promise<any> {
  if (!token || !secretString) {
    throw new Error('Token and secret are required for decryption');
  }

  // Convert the secret string into a 32-byte Uint8Array
  const encoder = new TextEncoder();
  const secret = encoder.encode(secretString);

  if (secret.length !== 32) {
    throw new Error('Secret must be exactly 32 bytes (e.g., 32 ASCII characters) for A256GCM');
  }

  try {
    const { payload } = await jwtDecrypt(token, secret);
    
    return payload;
  } catch (err: any) {
    console.error('Decryption failed:', err.message);
    throw new Error('Invalid or corrupted token');
  }
}

export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const formatDate = (timestamp: string | number) => {
  const date = new Date(Number(timestamp)); // convert string or number to Date
  if (isNaN(date.getTime())) return "Invalid date";

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // zero-based
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};


// utils/timeAgo.js

/**
 * Calculates how many minutes ago or from now the given timestamp is.
 * @param {number} timestamp - The timestamp in milliseconds (Unix time).
 * @returns {string} - A human-readable string like "10 minutes ago" or "5 minutes from now".
 */
export function getMinutesAgo(timestamp) {
  const now = Date.now();
  const diffInMs = now - timestamp;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 0) {
    return `${Math.abs(diffInMinutes)} minute(s) from now`;
  } else if (diffInMinutes === 0) {
    return "Just now";
  } else {
    return `${diffInMinutes} minute(s) ago`;
  }
}

// utils/minutesFromNow.js

/**
 * Calculates how many minutes from now the given timestamp is.
 * If the timestamp is in the past, returns 0.
 * @param {number} timestamp - Future timestamp in milliseconds (Unix time).
 * @returns {number} - Minutes from now.
 */
export function getMinutesFromNow(timestamp) {
  const now = Date.now();
  const diffInMs = timestamp - now;

  if (diffInMs <= 0) return 0;

  const diffInMinutes = Math.ceil(diffInMs / (1000 * 60));
  return diffInMinutes;
}

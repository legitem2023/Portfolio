// types/next.d.ts
import { StaticImageData } from 'next/image';

declare module 'next/image' {
  interface StaticImageData {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
  }
}

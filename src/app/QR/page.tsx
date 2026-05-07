// pages/signup.tsx
"use client";
import { useState, ChangeEvent, FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '../components/Footer';
import QRCodeWithLogo from '../components/QRCodeWithLogo';
import Header from '../components/Header';
export default function QRcode() {
   

  return (
    <>
      <Head>
        <title>Create Account | VendorCity</title>
        <meta name="description" content="Create your VendorCity account" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
        <Header/> 
        <QRCodeWithLogo/>
        <Footer />
      </div>
    </>
  );
}

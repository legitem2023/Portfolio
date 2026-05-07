// pages/signup.tsx
"use client";
import { useState, ChangeEvent, FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '../components/Footer';
import { useMutation } from '@apollo/client';
import { CREATEUSER } from '../components/graphql/mutation';
import Header from '../components/Header';
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  subscribe: boolean;
}

export default function QRcode() {
   

  return (
    <>
      <Head>
        <title>Create Account | VendorCity</title>
        <meta name="description" content="Create your VendorCity account" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
        <Header/> 
        <Footer />
      </div>
    </>
  );
}

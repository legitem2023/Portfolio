// pages/login.tsx
"use client";
import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Footer from './components/Footer';
import Header from './components/Header';



export default function About() {


  return (
    <>
      <Head>
        <title>About Us</title>
        <meta name="description" content="Login to your ELEGANCE account" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
        <Header/>
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border border-indigo-100">
          </div>
        </div>    
        <Footer/>
      </div>
    </>
  );
                      }

'use client'
// pages/index.tsx (or wherever you want to use the component)

import { useQuery, NetworkStatus } from '@apollo/client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GETPRODUCT } from '../components/graphql/query';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Image from 'next/image';
import { 
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube
} from 'lucide-react';
const EcommercePage: React.FC = () => {

  // Use networkStatus to track loading states
  const { data, loading, error } = useQuery(GETPRODUCT, {
    variables: {
      id:""
    }
  });
  
  console.log(data);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
      <Header/>
      {/* Footer */}
      <Footer/>
    </div>
  );
};

export default EcommercePage;

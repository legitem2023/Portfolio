
// pages/index.tsx (or wherever you want to use the component)
import React from 'react';
import { useQuery, NetworkStatus } from '@apollo/client';
import { GETPRODUCTS } from '../graphql/query';
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
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
      <Header/>
      {/* Footer */}
      <Footer/>
    </div>
  );
};

export default EcommercePage;

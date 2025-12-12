// pages/index.tsx (or wherever you want to use the component)
import React from 'react';
import DeluxeNavTabs from '../../components/DeluxeNavTabs';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import UserProfile from '../../components/UserProfile';
import MerchantDetails from '../../components/Merchants/MerchantDetails';

import { 
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube
} from 'lucide-react';
const AccountPage: React.FC = () => {
  const params = useParams();
  const id = params.id;
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
      <Header/>    
      {/* Footer */}
      <MerchantDetails userId={id}/>
   <Footer/>
    </div>
  );
};

export default AccountPage;

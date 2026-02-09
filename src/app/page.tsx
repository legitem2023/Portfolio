// pages/index.tsx (or wherever you want to use the component)
import React from 'react';
import DeluxeNavTabs from './components/DeluxeNavTabs';
import ParticleBackground from './components/ParticleBackground';

import Footer from './components/Footer';
import Header from './components/Header';
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
    <div className="min-h-screen p-0">
     <ParticleBackground/>
      <Header/>
      <DeluxeNavTabs />
  
      {/* Footer */}
      <Footer/>
    </div>
  );
};

export default EcommercePage;

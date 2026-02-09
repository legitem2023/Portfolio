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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
      <Header/>
   
      <ParticleBackground 
        intensity={0.0005}
        backgroundColor="#000011"
        particleColor="#88ccff"
        enableMouseInteraction={true}
        particleCount={3000}
        className="fixed inset-0"
      />
      <DeluxeNavTabs />
  
      {/* Footer */}
   <Footer/>
    </div>
  );
};

export default EcommercePage;

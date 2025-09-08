// pages/index.tsx (or wherever you want to use the component)
import React from 'react';
import DeluxeNavTabs from './components/DeluxeNavTabs';
import Footer from './components/Footer';

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
      <div className="text-center p-4">
        
        <Image
              src={`/Dlogo.svg`}
              alt="home1"
              height="80"
              width="160"
              className="h-25 w-50"
            />
      </div>
      <DeluxeNavTabs />
      
      {/* Footer */}
   <Footer/>
    </div>
  );
};

export default EcommercePage;

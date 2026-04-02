// pages/index.tsx (or wherever you want to use the component)
import React from 'react';
import SuggestionBox from '../components/SuggestionBox';
import Image from 'next/image';
import OutFolderTabs from '../components/OutFolderTabs';
import Header from '../components/Header';

import { 
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube
} from 'lucide-react';
const Page: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
     <Header/>
      <SuggestionBox/>
      <OutFolderTabs/>
    </div>
  );
};

export default Page;

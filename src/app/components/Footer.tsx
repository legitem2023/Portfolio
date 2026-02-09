// components/Footer.tsx
import Link from 'next/link';
import { 
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="z-20 bg-violet-50 text-purple-900 pt-16 pb-8 px-4 sm:pb-50">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
<div className="flex space-x-4">
              <a href="#" className="text-blue-600 hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-rose-200 hover:text-white">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-indigo-600 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-rose-600 hover:text-white">
                <Youtube size={20} />
              </a>
            </div>
          </div>


          <div>
            <h3 className="text-lg font-semibold mb-4">Information</h3>
            <ul className="space-y-2">
              <li><Link href="/About" className="text-indigo-600 hover:text-white">About Us</Link></li>
              <li><Link href="/Contact" className="text-indigo-600 hover:text-white">Contact Us</Link></li>
              <li><Link href="/Shipping" className="text-indigo-600 hover:text-white">Shipping & Returns</Link></li>
              <li><Link href="/FAQ" className="text-indigo-600 hover:text-white">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-indigo-600">
                <Phone size={16} className="mr-2" />
                <span>+639153392813</span>
              </li>
              <li className="flex items-center text-indigo-600">
                <Mail size={16} className="mr-2" />
                <span>VendorCity.net</span>
              </li>
              <li className="flex items-center text-indigo-600">
                <MapPin size={16} className="mr-2" />
                <span>Taytay, Rizal</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-indigo-400">
          <p>© {new Date().getFullYear()} VendorCity.net All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

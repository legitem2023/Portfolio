// components/Footer.tsx
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
    <footer className="bg-indigo-50 text-purple-900 pt-16 pb-8 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-xl font-bold mb-4">LUXE</h3>
            <p className="text-gray-400 mb-4">Elevating your style with premium quality and exceptional design.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-indigo-600 hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-indigo-600 hover:text-white">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-indigo-600 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-indigo-600 hover:text-white">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-indigo-600 hover:text-white">New Arrivals</a></li>
              <li><a href="#" className="text-indigo-600 hover:text-white">Best Sellers</a></li>
              <li><a href="#" className="text-indigo-600 hover:text-white">Collections</a></li>
              <li><a href="#" className="text-indigo-600 hover:text-white">Sale</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Information</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-indigo-600 hover:text-white">About Us</a></li>
              <li><a href="#" className="text-indigo-600 hover:text-white">Contact Us</a></li>
              <li><a href="#" className="text-indigo-600 hover:text-white">Shipping & Returns</a></li>
              <li><a href="#" className="text-indigo-600 hover:text-white">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-indigo-600">
                <Phone size={16} className="mr-2" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center text-indigo-600">
                <Mail size={16} className="mr-2" />
                <span>info@luxe.com</span>
              </li>
              <li className="flex items-center text-indigo-600">
                <MapPin size={16} className="mr-2" />
                <span>123 Luxury Ave, New York, NY</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-indigo-400">
          <p>© {new Date().getFullYear()} LUXE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

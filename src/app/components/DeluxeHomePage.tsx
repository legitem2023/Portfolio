// components/DeluxeHomePage.tsx
import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { 
  Search, 
  ShoppingBag, 
  User, 
  Heart, 
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Star,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube
} from 'lucide-react';

const DeluxeHomePage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Hero carousel data
  const heroSlides = [
    {
      id: 1,
      title: "Elevate Your Style",
      subtitle: "Discover the latest collection of luxury fashion",
      image: "/api/placeholder/1200/600",
      cta: "Shop Now",
      bgColor: "bg-gradient-to-r from-purple-900 to-indigo-800"
    },
    {
      id: 2,
      title: "Summer Collection",
      subtitle: "Exquisite pieces for the warmest season",
      image: "/api/placeholder/1200/600",
      cta: "Explore Collection",
      bgColor: "bg-gradient-to-r from-amber-800 to-orange-700"
    },
    {
      id: 3,
      title: "Limited Edition",
      subtitle: "Unique items crafted with precision and care",
      image: "/api/placeholder/1200/600",
      cta: "View Items",
      bgColor: "bg-gradient-to-r from-emerald-800 to-teal-700"
    }
  ];

  // Featured categories
  const categories = [
    {
      id: 1,
      name: "Luxury Handbags",
      image: "/api/placeholder/400/400",
      items: "24 products"
    },
    {
      id: 2,
      name: "Designer Apparel",
      image: "/api/placeholder/400/400",
      items: "32 products"
    },
    {
      id: 3,
      name: "Premium Watches",
      image: "/api/placeholder/400/400",
      items: "18 products"
    },
    {
      id: 4,
      name: "Fine Jewelry",
      image: "/api/placeholder/400/400",
      items: "27 products"
    }
  ];

  // Featured products
  const featuredProducts = [
    {
      id: 1,
      name: "Designer Leather Handbag",
      price: 349.99,
      originalPrice: 449.99,
      image: "/api/placeholder/300/300",
      rating: 4.8,
      reviews: 142,
      isNew: true
    },
    {
      id: 2,
      name: "Premium Silk Blouse",
      price: 129.99,
      image: "/api/placeholder/300/300",
      rating: 4.5,
      reviews: 87,
      isNew: false
    },
    {
      id: 3,
      name: "Luxury Gold Watch",
      price: 899.99,
      originalPrice: 1099.99,
      image: "/api/placeholder/300/300",
      rating: 4.9,
      reviews: 205,
      isNew: false
    },
    {
      id: 4,
      name: "Diamond Stud Earrings",
      price: 599.99,
      image: "/api/placeholder/300/300",
      rating: 4.7,
      reviews: 93,
      isNew: true
    }
  ];

  // Testimonials
  const testimonials = [
    {
      id: 1,
      name: "Emma Johnson",
      role: "Fashion Influencer",
      comment: "The quality of their products is exceptional. Every piece feels luxurious and lasts for years.",
      avatar: "/api/placeholder/80/80",
      rating: 5
    },
    {
      id: 2,
      name: "Michael Reynolds",
      role: "Lifestyle Blogger",
      comment: "Their customer service is as premium as their products. Always a pleasure to shop here.",
      avatar: "/api/placeholder/80/80",
      rating: 5
    },
    {
      id: 3,
      name: "Sophia Williams",
      role: "Interior Designer",
      comment: "I always find unique, high-quality pieces that become conversation starters.",
      avatar: "/api/placeholder/80/80",
      rating: 4
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Announcement Bar */}
      <div className="bg-gray-900 text-white py-2 text-center text-sm">
        <p>Free express shipping on all orders over $200 | <span className="font-semibold">Shop now</span></p>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="text-2xl font-bold text-gray-900">LUXE</div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">New Arrivals</a>
              <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Collections</a>
              <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Categories</a>
              <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Brands</a>
              <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Sale</a>
            </nav>

            {/* Right Icons */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-purple-600">
                <Search size={20} />
              </button>
              <button className="text-gray-600 hover:text-purple-600">
                <Heart size={20} />
              </button>
              <button className="text-gray-600 hover:text-purple-600 relative">
                <ShoppingBag size={20} />
                <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
              </button>
              <button className="text-gray-600 hover:text-purple-600">
                <User size={20} />
              </button>
              <button 
                className="md:hidden text-gray-600"
                onClick={() => setIsMenuOpen(true)}
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg">
            <div className="p-4 flex justify-between items-center border-b">
              <span className="font-bold">Menu</span>
              <button onClick={() => setIsMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="p-4 flex flex-col space-y-4">
              <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">New Arrivals</a>
              <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Collections</a>
              <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Categories</a>
              <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Brands</a>
              <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Sale</a>
            </nav>
          </div>
        </div>
      )}

      <main>
        {/* Hero Carousel */}
        <section className="relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay, EffectFade]}
            spaceBetween={0}
            slidesPerView={1}
            navigation={{
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            }}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            effect="fade"
            loop={true}
            className="h-screen max-h-[700px]"
          >
            {heroSlides.map((slide) => (
              <SwiperSlide key={slide.id} className={`relative ${slide.bgColor} text-white`}>
                <div className="absolute inset-0 bg-black opacity-40"></div>
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center max-w-2xl px-4">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">{slide.title}</h1>
                    <p className="text-xl mb-8">{slide.subtitle}</p>
                    <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                      {slide.cta}
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
            
            {/* Custom Navigation */}
            <div className="swiper-button-prev absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-20 text-white p-2 rounded-full">
              <ChevronLeft size={24} />
            </div>
            <div className="swiper-button-next absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-20 text-white p-2 rounded-full">
              <ChevronRight size={24} />
            </div>
          </Swiper>
        </section>

        {/* Featured Categories */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Discover our curated collections of luxury items, carefully selected to elevate your style and sophistication.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <div key={category.id} className="group relative overflow-hidden rounded-2xl shadow-lg">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6">
                    <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
                    <p className="text-gray-200 mb-4">{category.items}</p>
                    <button className="self-start text-white font-medium flex items-center">
                      Explore <ArrowRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Handpicked selection of our most exclusive and sought-after items.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-md overflow-hidden group">
                  <div className="relative overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {product.isNew && (
                      <div className="absolute top-4 left-4 bg-white text-gray-900 text-xs font-bold px-2 py-1 rounded">
                        NEW
                      </div>
                    )}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100">
                        <Heart size={18} />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                    <div className="flex items-center mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i}
                            size={14}
                            className={i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">${product.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button className="bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors">
                View All Products
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Hear from our discerning customers who appreciate quality and elegance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white rounded-2xl shadow-md p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          size={16}
                          className={i < testimonial.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 italic">{testimonial.comment}</p>
                  <div className="flex items-center">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover mr-3"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-16 px-4 bg-gray-900 text-white">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Join Our Exclusive List</h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8">Subscribe to receive updates on new collections, special offers, and insider events.</p>
            
            <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
              <input 
                type="email" 
                placeholder="Your email address"
                className="flex-1 px-4 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button 
                type="submit"
                className="bg-purple-600 px-6 py-3 rounded-full font-medium hover:bg-purple-700 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-bold mb-4">LUXE</h3>
              <p className="text-gray-400 mb-4">Elevating your style with premium quality and exceptional design.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <Facebook size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Instagram size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Twitter size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Youtube size={20} />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Shop</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">New Arrivals</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Best Sellers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Collections</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Sale</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Information</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Shipping & Returns</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">FAQs</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-400">
                  <Phone size={16} className="mr-2" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center text-gray-400">
                  <Mail size={16} className="mr-2" />
                  <span>info@luxe.com</span>
                </li>
                <li className="flex items-center text-gray-400">
                  <MapPin size={16} className="mr-2" />
                  <span>123 Luxury Ave, New York, NY</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} LUXE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DeluxeHomePage;

// pages/products/[id].tsx
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import { Product } from '../../../types';

const ProductDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Sample product data - in a real app, you would fetch this from an API
  const sampleProducts: Product[] = [
    {
      id: '1',
      name: 'Premium Leather Handbag',
      price: 299,
      image: '/images/handbag.jpg',
      images: [
        '/images/handbag.jpg',
        '/images/handbag-2.jpg',
        '/images/handbag-3.jpg'
      ],
      category: 'Accessories',
      rating: 4.8,
      description: 'Handcrafted genuine leather handbag with gold accents',
      longDescription: 'This exquisite handbag is crafted from the finest genuine leather, featuring meticulous stitching and luxurious gold hardware. The spacious interior includes multiple compartments for organization, while the adjustable strap allows for versatile carrying options. Perfect for both casual outings and formal events.',
      features: ['Genuine leather', 'Gold hardware', 'Adjustable strap', 'Multiple compartments', 'Secure closure'],
      stock: 15,
      colors: ['Black', 'Brown', 'Burgundy'],
      sizes: ['One Size']
    },
    {
      id: '2',
      name: 'Luxury Watch',
      price: 1250,
      image: '/images/watch.jpg',
      images: [
        '/images/watch.jpg',
        '/images/watch-2.jpg',
        '/images/watch-3.jpg'
      ],
      category: 'Accessories',
      rating: 4.9,
      description: 'Swiss automatic movement with diamond markers',
      longDescription: 'Experience precision and elegance with our Swiss-made automatic timepiece. Featuring a sapphire crystal face, diamond hour markers, and a genuine leather strap, this watch combines sophisticated design with exceptional craftsmanship. The self-winding movement ensures accurate timekeeping without the need for batteries.',
      features: ['Swiss automatic movement', 'Sapphire crystal', 'Diamond markers', 'Water resistant', 'Genuine leather strap'],
      stock: 8,
      colors: ['Silver', 'Gold', 'Rose Gold'],
      sizes: ['Standard']
    },
    {
      id: '3', 
      name: 'Cashmere Scarf',
      price: 189,
      image: '/images/scarf.jpg',
      images: [
        '/images/scarf.jpg',
        '/images/scarf-2.jpg',
        '/images/scarf-3.jpg'
      ],
      category: 'Accessories',
      rating: 4.7,
      description: '100% pure cashmere with heritage pattern',
      longDescription: 'Wrap yourself in luxury with our 100% pure cashmere scarf. Featuring a timeless heritage pattern, this scarf offers exceptional softness and warmth without bulk. The meticulous craftsmanship ensures durability while maintaining the delicate feel of premium cashmere.',
      features: ['100% pure cashmere', 'Heritage pattern', 'Lightweight warmth', 'Hand-finished edges'],
      stock: 22,
      colors: ['Cream', 'Navy', 'Burgundy', 'Grey'],
      sizes: ['One Size']
    }
  ];

  useEffect(() => {
    if (id) {
      const foundProduct = sampleProducts.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
      }
      setLoading(false);
    }
  }, [id]);

  const handleAddToCart = () => {
    // In a real app, this would add the product to a shopping cart
    alert(`Added ${quantity} ${product?.name} to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-golden-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-gray-900 mb-4">Product Not Found</h1>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-golden-500 text-white rounded-lg hover:bg-golden-600 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{product.name} | LUXE</title>
        <meta name="description" content={product.description} />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <button 
                  onClick={() => router.push('/')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Home
                </button>
              </li>
              <li className="flex items-center">
                <span className="text-gray-400 mx-2">/</span>
                <button 
                  onClick={() => router.push('/')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {product.category}
                </button>
              </li>
              <li className="flex items-center">
                <span className="text-gray-400 mx-2">/</span>
                <span className="text-gray-900">{product.name}</span>
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square relative overflow-hidden rounded-2xl bg-white luxury-shadow">
                <Image
                  src={product.images?.[selectedImage] || product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square relative overflow-hidden rounded-lg transition-all ${
                        selectedImage === index ? 'ring-2 ring-golden-500' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} view ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 25vw, 12.5vw"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-serif font-light text-gray-900 mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(Math.floor(product.rating))}
                    {'☆'.repeat(5 - Math.floor(product.rating))}
                  </div>
                  <span className="ml-2 text-gray-600">
                    {product.rating} ({Math.floor(Math.random() * 100) + 1} reviews)
                  </span>
                </div>
                <p className="text-3xl font-light text-golden-600 mb-4">
                  ${product.price.toLocaleString()}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  {product.longDescription || product.description}
                </p>
              </div>

              {/* Features */}
              {product.features && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-golden-500 mr-2">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Options */}
              <div className="space-y-4">
                {product.colors && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Color</h3>
                    <div className="flex space-x-3">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          className="w-10 h-10 rounded-full border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-golden-500"
                          style={{ 
                            backgroundColor: color.toLowerCase() === 'black' ? '#000' : 
                                            color.toLowerCase() === 'brown' ? '#795548' :
                                            color.toLowerCase() === 'burgundy' ? '#800020' :
                                            color.toLowerCase() === 'cream' ? '#FFFDD0' :
                                            color.toLowerCase() === 'navy' ? '#000080' :
                                            color.toLowerCase() === 'grey' ? '#808080' :
                                            color.toLowerCase() === 'silver' ? '#C0C0C0' :
                                            color.toLowerCase() === 'gold' ? '#FFD700' :
                                            color.toLowerCase() === 'rose gold' ? '#B76E79' : '#fff'
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Size</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:border-golden-500 hover:text-golden-600 transition-colors"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="pt-6">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-golden-500 text-white py-4 px-6 rounded-lg hover:bg-golden-600 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add to Cart - ${(product.price * quantity).toLocaleString()}
                </button>
              </div>

              {/* Stock Information */}
              <div className="text-sm text-gray-600">
  {(product.stock ?? 0) > 5 ? (
    <span className="text-green-600">In stock ({product.stock} available)</span>
  ) : (product.stock ?? 0) > 0 ? (
    <span className="text-orange-500">Low stock ({product.stock} left)</span>
  ) : (
    <span className="text-red-600">Out of stock</span>
  )}
</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;

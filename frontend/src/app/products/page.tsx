'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageLayout from '../../components/layout/PageLayout';

// Mock products data (same as landing page)
const productsData = [
  {
    id: 1,
    name: 'Safyra Elite Ring',
    price: '$299',
    description: 'Elegant protection in a sophisticated ring design. Features emergency alert system with GPS tracking.',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400',
    materials: 'Sterling Silver, Titanium Core',
    dimensions: '18mm × 4mm × 2mm',
    features: [
      'Emergency SOS with GPS tracking',
      'Discreet panic button activation',
      'Water-resistant design',
      '48-hour battery life',
      'Wireless charging',
      'Mobile app integration'
    ]
  },
  {
    id: 2,
    name: 'Safyra Classic Bracelet',
    price: '$249',
    description: 'Timeless bracelet with integrated safety features. Discreet panic button and health monitoring.',
    image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400',
    materials: 'Rose Gold Plated, Smart Ceramic',
    dimensions: '190mm × 8mm × 3mm',
    features: [
      'Heart rate monitoring',
      'Fall detection alerts',
      'Emergency contact system',
      '72-hour battery life',
      'Adjustable sizing',
      'Health data sync'
    ]
  },
  {
    id: 3,
    name: 'Safyra Smart Necklace',
    price: '$349',
    description: 'Beautiful necklace with advanced safety technology. Voice activation and automatic alerts.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
    materials: '14K Gold Fill, Smart Glass',
    dimensions: '450mm chain, 15mm pendant',
    features: [
      'Voice-activated SOS',
      'Ambient sound detection',
      'Location sharing',
      'Gesture-based controls',
      '96-hour battery life',
      'Elegant pendant design'
    ]
  },
  {
    id: 4,
    name: 'Safyra Active Watch',
    price: '$399',
    description: 'Sport-ready watch with comprehensive safety suite. Fitness tracking meets personal security.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    materials: 'Aircraft Aluminum, Sapphire Glass',
    dimensions: '42mm × 46mm × 12mm',
    features: [
      'Comprehensive fitness tracking',
      'Emergency workout alerts',
      'Real-time location sharing',
      'Impact detection',
      '7-day battery life',
      'Water-resistant to 50m'
    ]
  }
];

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'rings', name: 'Rings' },
    { id: 'bracelets', name: 'Bracelets' },
    { id: 'necklaces', name: 'Necklaces' },
    { id: 'watches', name: 'Watches' }
  ];

  const getProductCategory = (productName: string) => {
    const name = productName.toLowerCase();
    if (name.includes('ring')) return 'rings';
    if (name.includes('bracelet')) return 'bracelets';
    if (name.includes('necklace')) return 'necklaces';
    if (name.includes('watch')) return 'watches';
    return 'all';
  };

  const filteredProducts = selectedCategory === 'all'
    ? productsData
    : productsData.filter(product => getProductCategory(product.name) === selectedCategory);

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-white pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-safyra-navy mb-6 leading-tight">
                Our Product Collection
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed">
                Discover our range of elegant safety jewelry designed to empower and protect
              </p>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="py-12 bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Browse by Category</h2>
              <p className="text-gray-600">Find the perfect safety jewelry for your needs</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-full transition-all duration-200 font-medium border-2 ${
                    selectedCategory === category.id
                      ? 'bg-blue-950 text-white border-safyra-navy shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-safyra-navy hover:text-safyra-navy hover:shadow-md'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <p className="text-gray-600">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group h-full flex flex-col">
                    <div className="relative h-64 bg-gray-100 overflow-hidden flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-safyra-navy transition-colors min-h-[3.5rem] line-clamp-2">{product.name}</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed flex-grow line-clamp-3">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                        <span className="text-2xl font-bold text-safyra-navy">{product.price}</span>
                        <Link
                          href={`/products/${product.id}`}
                          className="px-4 py-2 bg-blue-950 text-white rounded-full hover:bg-rose-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex-shrink-0"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l4 4m-4-4H3" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-6">No products match the selected category. Try selecting a different category.</p>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="px-6 py-3 bg-safyra-navy text-white rounded-full hover:bg-opacity-90 transition-colors font-medium"
                    >
                      Show All Products
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-safyra-navy text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Enhance Your Safety?
            </h2>
            <p className="text-xl mb-8 text-gray-300">
              All products are currently in development. Sign up to be notified when they become available.
            </p>
            <Link
              href="/contact"
              className="inline-block px-8 py-3 bg-safyra-gold text-safyra-navy font-bold rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Get Notified
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

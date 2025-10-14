'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import PageLayout from '../../../components/layout/PageLayout';
import {
  ProductSpecs,
  ProductImage,
  ProductFeaturesList,
  AvailabilityNotice
} from '../../../components/product';

// Product type definition
type Product = {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
  materials: string;
  dimensions: string;
  features: string[];
};

// Mock products data (same as other pages)
const productsData: Product[] = [
  {
    id: 1,
    name: 'Safyra Elite Ring',
    price: '$299',
    description: 'Elegant protection in a sophisticated ring design. Features emergency alert system with GPS tracking and discreet panic button activation. Perfect for everyday wear with premium materials.',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
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
    description: 'Timeless bracelet with integrated safety features. Includes heart rate monitoring, fall detection alerts, and emergency contact system with elegant rose gold finish.',
    image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800',
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
    description: 'Beautiful necklace with advanced safety technology. Features voice activation, ambient sound detection, and elegant pendant design with 14K gold fill finish.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
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
    description: 'Sport-ready watch with comprehensive safety suite. Combines fitness tracking with personal security features in a durable aluminum design with sapphire glass.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id as string);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const foundProduct = productsData.find(p => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
    } else {
      router.push('/products');
    }
  }, [productId, router]);

  if (!product) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
            <Link href="/products" className="text-safyra-navy hover:underline">
              Return to Products
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="pt-20 pb-5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/products"
              className="inline-flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 text-safyra-navy hover:text-rose-600 transition-all duration-200 font-medium group rounded-lg border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
            >
              <ArrowLeft size={20} className="mr-3 group-hover:-translate-x-1 transition-transform" />
              Back to Products
            </Link>
          </div>
        </div>

        {/* Product Detail */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-20">
            {/* Product Image */}
            <div>
              <ProductImage
                image={product.image}
                name={product.name}
              />
            </div>

            {/* Product Info */}
            <div className="space-y-8 lg:pt-4">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-safyra-navy leading-tight mb-4">
                    {product.name}
                  </h1>
                  <p className="text-gray-600 text-lg sm:text-xl leading-relaxed mb-8">
                    {product.description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
                  <span className="text-4xl sm:text-5xl font-bold text-safyra-navy">
                    {product.price}
                  </span>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsLiked(!isLiked)}
                      className={`p-3 rounded-full transition-all duration-200 hover:scale-105 ${
                        isLiked
                          ? 'bg-rose-100 text-rose-600 shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105 transition-all duration-200"
                    >
                      <Share2 size={22} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <ProductSpecs
                  materials={product.materials}
                  dimensions={product.dimensions}
                />

                <ProductFeaturesList features={product.features} />

                <div className="pt-4">
                  <AvailabilityNotice productName={product.name} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <section className="py-20 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-safyra-navy mb-12 text-center">
              You might also like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {productsData
                .filter(p => p.id !== product.id)
                .slice(0, 3)
                .map((relatedProduct) => (
                <div key={relatedProduct.id} className="bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full flex flex-col group">
                  <div className="relative h-56 bg-gray-100 overflow-hidden flex-shrink-0">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-safyra-navy transition-colors min-h-[3.5rem] line-clamp-2">{relatedProduct.name}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed flex-grow line-clamp-2">
                      {relatedProduct.description.split('.')[0]}.
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                      <span className="text-2xl font-bold text-safyra-navy">{relatedProduct.price}</span>
                      <Link
                        href={`/products/${relatedProduct.id}`}
                        className="px-6 py-2 bg-safyra-navy text-white rounded-full hover:bg-rose-600 transition-all duration-200 font-medium flex-shrink-0"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

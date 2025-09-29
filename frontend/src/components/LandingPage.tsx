
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Diamond, Users, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';

// Hero Section Component
const HeroSection = () => {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center pt-16">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1545622783-b3e021430fee?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Woman wearing elegant jewelry"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}
          >
            Empower Your Safety with Safyra
          </h1>
          <p
            className="text-xl md:text-2xl text-white mb-8 animate-slide-up"
            style={{ animationDelay: '200ms', textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}
          >
            Smart jewelry that protects and empowers
          </p>
          <Link
            href="/dashboard"
            className="cta-button inline-block animate-slide-up"
            style={{ animationDelay: '400ms' }}
          >
            Discover Our Collection
          </Link>
        </div>
      </div>
    </section>
  );
};

// Features Section Component
const features = [
  {
    icon: Bell,
    title: 'Real-Time Alerts',
    description: 'Instant notifications for your safety',
    color: 'text-safyra-navy'
  },
  {
    icon: Diamond,
    title: 'Discreet Design',
    description: 'Elegance meets functionality',
    color: 'text-rose-600'
  },
  {
    icon: Users,
    title: 'Community Support',
    description: 'Connect with a trusted network',
    color: 'text-emerald-600'
  },
  {
    icon: Lightbulb,
    title: 'Empowerment Tools',
    description: 'Resources at your fingertips',
    color: 'text-rose-600'
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-safyra-navy text-center mb-16">
          Smart Protection, Elegant Design
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col items-center text-center h-full">
                <div className={`${feature.color} mb-4`}>
                  <feature.icon size={36} />
                </div>
                <h3 className="text-xl font-bold text-safyra-navy mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Mock products data
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

// Product Showcase Component
const ProductShowcase = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % productsData.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + productsData.length) % productsData.length);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Our Collection</h2>
          <Link
            href="/products"
            className="px-4 py-2 border border-rose-600 text-rose-600 rounded-full hover:bg-rose-600 hover:text-white transition-colors"
          >
            View All Products
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsData.slice(0, 3).map((product) => (
            <div key={product.id} className="product-card">
              <div className="relative h-48 bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">
                  {product.description.split('.')[0]}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xl font-bold text-rose-600">{product.price}</span>
                  <Link
                    href={`/products/${product.id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:border-rose-600 hover:text-rose-600 transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Testimonials Section Component
const testimonials = [
  {
    id: 1,
    quote: "Safyra gives me peace of mind whether I'm commuting at night or traveling solo. The elegant design means no one knows it's also my personal security system.",
    name: "Michelle K.",
    title: "Marketing Executive",
    image: "https://randomuser.me/api/portraits/women/12.jpg"
  },
  {
    id: 2,
    quote: "As a college student, my Safyra bracelet makes me feel secure walking across campus late at night. It's stylish enough for everyday wear and formal events.",
    name: "Sophia R.",
    title: "University Student",
    image: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    id: 3,
    quote: "I bought Safyra for my daughter who just moved to the city. It's the perfect combination of fashion and safety that she actually wants to wear every day.",
    name: "Jennifer L.",
    title: "Mother & Business Owner",
    image: "https://randomuser.me/api/portraits/women/67.jpg"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-safyra-navy text-center mb-12">
          What Our Customers Say
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="flex flex-col items-center text-center">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full mb-4 object-cover border-2 border-rose-600"
                />
                <p className="text-gray-600 italic mb-4">
                  "{testimonial.quote}"
                </p>
                <h4 className="font-bold text-safyra-navy">
                  {testimonial.name}
                </h4>
                <p className="text-sm text-gray-500">
                  {testimonial.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section Component
const CtaSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setMessage("Thank you for joining the Safyra community!");
      setEmail('');
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 3000);
    }, 1000);
  };

  return (
    <section className="py-20 text-white" style={{ background: 'linear-gradient(135deg, #1a237e, #e11d48)' }}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Join the Safyra Community
          </h2>
          <p className="text-gray-300 mb-8 text-lg">
            Stay updated with our latest products, safety tips, and exclusive offers.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="flex-grow bg-white px-4 py-3 text-blue-950 border-2 border-transparent rounded-lg focus:border-rose-600 focus:outline-none transition-all duration-300"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-rose-600 text-white font-bold rounded-lg transition-all duration-300 hover:bg-rose-700 disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>

          {message && (
            <p className="text-green-400 mt-4">{message}</p>
          )}

          <p className="text-sm text-gray-400 mt-4">
            We respect your privacy and will never share your information.
          </p>
        </div>
      </div>
    </section>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <ProductShowcase />
      <TestimonialsSection />
      <CtaSection />
    </div>
  );
};

export default LandingPage;

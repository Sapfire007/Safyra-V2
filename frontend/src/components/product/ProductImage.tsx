import React from 'react';
import { Badge } from "@/components/ui/Badge";

interface ProductImageProps {
  image: string;
  name: string;
}

const ProductImage: React.FC<ProductImageProps> = ({ image, name }) => {
  return (
    <div className="relative rounded-xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
      <img
        src={image}
        alt={name}
        className="w-full h-[400px] sm:h-[500px] lg:h-[600px] object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
      <Badge
        className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-safyra-emerald text-white text-sm sm:text-base px-3 py-1 sm:px-4 sm:py-2 shadow-lg"
      >
        Coming Soon
      </Badge>
    </div>
  );
};

export default ProductImage;

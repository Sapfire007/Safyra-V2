import React from 'react';

interface ProductFeaturesListProps {
  features: string[];
}

const ProductFeaturesList: React.FC<ProductFeaturesListProps> = ({ features }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-safyra-navy mb-4">Key Features</h3>
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start group">
            <span className="inline-block h-2 w-2 bg-safyra-gold rounded-full mt-3 mr-4 flex-shrink-0 group-hover:bg-safyra-emerald transition-colors"></span>
            <span className="text-gray-700 leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductFeaturesList;

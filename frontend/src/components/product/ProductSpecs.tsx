import React from 'react';

interface ProductSpecsProps {
  materials: string;
  dimensions: string;
}

const ProductSpecs: React.FC<ProductSpecsProps> = ({ materials, dimensions }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-safyra-navy mb-4">Specifications</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Materials</h4>
          <p className="text-gray-600 font-medium">{materials}</p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Dimensions</h4>
          <p className="text-gray-600 font-medium">{dimensions}</p>
        </div>
      </div>
    </div>
  );
};

export default ProductSpecs;

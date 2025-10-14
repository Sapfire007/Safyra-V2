import React from 'react';

interface AvailabilityNoticeProps {
  productName: string;
}

const AvailabilityNotice: React.FC<AvailabilityNoticeProps> = ({ productName }) => {
  return (
    <div className="bg-gradient-to-br from-safyra-lightGray to-blue-50 p-8 rounded-xl border border-safyra-gold/30 shadow-sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-12 h-12 bg-safyra-gold/20 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-safyra-gold" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-safyra-navy mb-3">Availability Notice</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            The <span className="font-semibold text-safyra-navy">{productName}</span> is currently in development and will be available for purchase soon.
            Sign up for our newsletter to be notified when it becomes available.
          </p>
          <button className="inline-flex items-center px-6 py-3 bg-safyra-navy text-white font-medium rounded-lg hover:bg-safyra-navy/90 transition-colors">
            Get Notified
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityNotice;

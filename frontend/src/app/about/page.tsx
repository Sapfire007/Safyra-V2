import PageLayout from '../../components/layout/PageLayout';

export default function AboutUs() {
  return (
    <PageLayout>
      <div className="py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center text-safyra-navy mb-8">About Safyra</h1>
          <div className="max-w-4xl mx-auto text-gray-600 space-y-6">
            <p className="text-lg">
              Safyra is revolutionizing personal safety through elegant, smart jewelry that empowers women
              to feel secure and confident in any situation.
            </p>
            <p>
              Founded with the mission to combine fashion and function, Safyra creates discreet wearable
              technology that provides real-time safety monitoring, emergency alerts, and peace of mind
              for women worldwide.
            </p>
            <p>
              Our team of designers, engineers, and safety experts work tirelessly to create products
              that are not only technologically advanced but also beautiful and comfortable to wear every day.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

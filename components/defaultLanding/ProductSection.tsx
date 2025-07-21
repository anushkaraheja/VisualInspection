import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import features from './data/products.json';

const ProductSection = () => {
  const { t } = useTranslation('common');
  return (
    <section className="py-16 px-28 w-full bg-[#fbfbfc]">
      <div className="flex flex-col justify-center space-y-2">
        <h2 className="text-center text-4xl font-semibold normal-case">
          Products
        </h2>
        <p className="text-center text-gray-700 pb-4">
        Compliance. Clarity. Control.
        </p>
        <div className="flex flex-row gap-4 w-full justify-between">
            {features.map((feature: any, index) => {
              return (
                <div
                  className="card-compact card border border-gray-200 overflow-hidden flex-1 relative group"
                  key={index}
                  style={{
                    backgroundImage: `url(${feature.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'top',
                    minHeight: '40rem'
                  }}
                >
                  {/* Overlay */}
                  <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-white/100 group-hover:opacity-0 transition-opacity duration-300"/>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                  {/* Text */}
                  <div className="flex flex-col justify-end h-full text-center relative z-20">
                    <div className="bg-[#fbfbfc]/40 backdrop-blur-[2px] group-hover:bg-transparent group-hover:backdrop-blur-0 px-4 pt-6 space-y-1 transition duration-300">
                      <div className="text-black group-hover:text-white text-xl font-semibold transition duration-300">{feature.name}</div>
                      <div className="text-sm text-gray-700 group-hover:text-white transition duration-300">{feature.description}</div>
                      <div className="py-10">
                        <Link
                          href="/"
                          className="border border-[#1f2937] text-[#1f2937] bg-transparent group-hover:bg-[#fbfbfc] group-hover:text-black hover:bg-[#1f2937] hover:text-white px-8 py-3 rounded-md transition duration-300"
                        >
                          Learn More
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
    </section>
  );
};

export default ProductSection;

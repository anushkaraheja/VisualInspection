import Image from 'next/image';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className="relative w-full h-[650px] text-white overflow-hidden">
      <Image
        src="/hero-image.png"
        alt="Hero Background"
        layout="fill"
        objectFit="cover"
        priority
        style={{ transform: 'scaleX(-1)' }}
      />
      {/* Overlay Gradient */}
      <div
        className="absolute inset-0 z-10"
        style={{ background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 1.0), transparent 100%)' }}
      />

      {/* Text Content */}
      <div className="absolute inset-0 z-20 flex items-top justify-start pl-4 pt-32">
        <div className="p-10 rounded-lg text-center">
          <div className="flex flex-col items-center space-y-8">
            <h1 className="text-5xl md:text-5xl font-bold text-black leading-[2.0]">
              AI that Powers the Future <br />
              of Surveillance and Compliance
            </h1>
            <p className="whitespace-nowrap text-lg md:text-xl text-gray-700">
              Automate inspections, ensure compliance and transform your operations.
            </p>
            <Link
              href="/auth/join"
              className="bg-[#c80a1e] hover:bg-[#a40a19] text-white font-semibold px-6 py-3 rounded-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
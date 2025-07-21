import { type ReactElement } from 'react';
import Head from 'next/head';
import Navbar from '@/components/defaultLanding/Navbar';
import Footer from '@/components/defaultLanding/Footer';
import Image from 'next/image';

const About = () => {
  return (
    <main>
        <Head>
            <title>About Us – BrickRed Systems</title>
        </Head>
        <Navbar />
        {/* Page Name and background */}
        <section className="relative w-full h-[350px] text-white overflow-hidden z-0 bg-[#fbfbfc]">
            <Image
                src="/World-Map.svg"
                alt="World Map"
                layout="fill"
                objectFit="cover"
                priority
            />
            {/* Overlay */}
            <div className="absolute inset-0 z-10 bg-[#fbfbfc] bg-opacity-70" />
            {/* Text Content */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-5xl font-bold text-black mb-4">About Us</h1>
              <h3 className='font-semibold text-[#c80a1e]'>BrickRed Systems</h3>
            </div>
        </section>

        {/* Intro Text */}
        <section 
            className='text-md text-center bg-[#fbfbfc]'
            style={{ 
                backgroundImage: `url(/backgrounds/blob.svg)`,
                backgroundSize: 'cover',
                backgroundPosition: 'top',
                minHeight: '40rem'
            }}
        >
            <p className='px-40 py-12 text-gray-500'>
                Welcome to BrickRed, where innovation meets excellence, and technology transforms possibilities. Established in 2010, BrickRed has evolved into a dynamic force in the world of technology-driven solutions, with a keen focus on artificial intelligence (AI), cloud integration, and data governance.
            </p>
            
             {/* Journey */}
            <h3 className="font-semibold text-[28px] py-12">
                <span className="text-black"> Our </span> 
                <span className="text-[#c80a1e]"> Journey </span>
                <span className="text-black">so Far</span>
            </h3>
        </section>

    </main>
    
    
    
  );
};

About.getLayout = (page: React.ReactNode) => page;
export default About;
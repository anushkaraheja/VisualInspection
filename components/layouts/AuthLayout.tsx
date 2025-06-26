import app from '@/lib/app';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import authImg from '../../assets/logo/auth.png';
import mainImg from '../../assets/logo/main.png';

interface AuthLayoutProps {
  children: React.ReactNode;
  heading?: string;
  description?: string;
  hideRightLogo?: boolean; // New prop to control right side logo visibility
}

export default function AuthLayout({
  children,
  heading,
  description,
  hideRightLogo = false, // Default to false to maintain backward compatibility
}: AuthLayoutProps) {
  const { t } = useTranslation('common');

  return (
    <>
      <div className="flex min-h-screen w-full">
        {/* Left half - branding and information with specified background color */}
        <div className="hidden md:flex md:w-1/2 bg-[#F4F7F7] flex-col items-center justify-center p-8">
          <div className="mx-auto flex flex-col items-center justify-center space-y-12 w-full">
            {/* Logo - smaller size */}
            <div className="w-30 h-30 relative">
              <Image
                src={authImg}
                alt={app.name}
                width={150}
                height={150}
                className="object-contain"
                priority
                sizes="100px"
              />
            </div>
            
            {/* Main illustration - significantly larger size */}
            <div className="w-full max-w-xl h-auto relative">
              <Image
                src={mainImg}
                alt="Main illustration"
                width={1000}
                height={800}
                className="object-contain w-full"
                priority
                sizes="(max-width: 768px) 100vw, 1000px"
              />
            </div>
          </div>
        </div>

        {/* Right half - text and form content with dark background */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-20 lg:px-8 bg-[#111111] text-white">
          {/* Logo (shown on all screens in right half) */}
          <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
            {!hideRightLogo && (
              <div className="md:hidden flex flex-col items-center justify-center space-y-10">
                {/* Logo for mobile - smaller size */}
                <div className="w-20 h-20 relative">
                  <Image
                    src={authImg}
                    alt={app.name}
                    width={80}
                    height={80}
                    className="object-contain"
                    priority
                    sizes="80px"
                  />
                </div>
                
                {/* Main illustration for mobile - larger size */}
                <div className="w-full max-w-md relative">
                  <Image
                    src={mainImg}
                    alt="Main illustration"
                    width={700}
                    height={560}
                    className="object-contain w-full"
                    priority
                    sizes="700px"
                  />
                </div>
              </div>
            )}
            
            {/* Text always displayed above form */}
            {heading && (
              <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-white">
                {t(heading)}
              </h2>
            )}
            {description && (
              <p className="text-center text-gray-300">
                {t(description)}
              </p>
            )}
          </div>
          
          {/* Form content */}
          <div className="sm:mx-auto sm:w-full sm:max-w-md">{children}</div>
        </div>
      </div>
    </>
  );
}

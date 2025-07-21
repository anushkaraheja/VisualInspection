import Link from 'next/link';
import Image from 'next/image';
import app from '@/lib/app';

const Navbar = () => {
    return (
        <div className="navbar sticky top-0 z-50 bg-white px-12 sm:px-16 min-h-[64px] flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-4 pr-10">
                <Link href="/" className="text-xl normal-case p-0 hover:bg-transparent focus:bg-transparent">
                    <Image
                    src={app.groupLogoUrl}
                    className="h-10"
                    alt={app.name}
                    width={100}
                    height={100}
                    />
                </Link>
            </div>
            {/* Right: Navigation */}
            <div className="flex-1 flex items-center justify-between">
                {/* Dropdowns + Link */}
                <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
                    <div className="relative group z-50">
                        <div tabIndex={0} className="cursor-pointer hover:text-red-600">AI Solutions</div>
                        <ul className="absolute top-full left-0 hidden group-hover:block menu p-2 shadow bg-white w-52 z-50">
                            <li><Link href="/solutions/farm-surveillance" className="hover:text-red-600">Farm Surveillance</Link></li>
                            <li><Link href="/solutions/visual-inspection" className="hover:text-red-600">Visual Inspection</Link></li>
                            <li><Link href="/solutions/ppe-compliance" className="hover:text-red-600">PPE Compliance</Link></li>
                        </ul>
                    </div>
                    <div className="relative group z-50">
                        <div tabIndex={0} className="cursor-pointer hover:text-red-600">Company</div>
                        <ul tabIndex={0} className="absolute top-full left-0 hidden group-hover:block menu p-2 shadow bg-white w-52 z-50">
                            <li><Link href="/about" className="hover:text-red-600">About Us</Link></li>
                            <li><Link href="/blog" className="hover:text-red-600">Blog</Link></li>
                            <li><Link href="/faqs" className="hover:text-red-600">FAQs</Link></li>
                            <li><Link href="/contact" className="hover:text-red-600">Contact Us</Link></li>
                        </ul>
                    </div>
                    <Link href="/careers" className="cursor-pointer hover:text-red-600">Careers</Link>
                </div>
            </div>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-4">
                <Link href="/auth/join" className="bg-[#c80a1e] hover:bg-[#a40a19] text-white font-regular text-sm px-6 py-2 rounded-md transition">                    
                    Sign up
                </Link>
                <Link href="/auth/login" className="border border-[#c80a1e] text-[#c80a1e] hover:bg-[#c80a1e] hover:text-white font-resular text-sm px-6 py-2 rounded-md transition">
                    Sign in
                </Link>
            </div>
        </div>
    );
};

export default Navbar;

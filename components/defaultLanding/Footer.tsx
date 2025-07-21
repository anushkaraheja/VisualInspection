import Image from "next/image";
import Link from "next/link";
import { FaLinkedin, FaTwitter, FaFacebookF } from "react-icons/fa";
import app from '@/lib/app';

const Footer = () => {
  return (
    <footer className="bg-neutral-700 text-white py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        {/* Logo & Intro */}
        <div>
          <Image src= {app.groupLogoUrl} alt="BrickRed Systems Logo" width={160} height={50} className="mb-4" />
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h3 className="font-semibold mb-4">Services</h3>
          <ul className="space-y-2">
            <li><Link href="#">PPE Compliance</Link></li>
            <li><Link href="#">Livestock Monitoring</Link></li>
            <li><Link href="#">Visual Inspection</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="font-semibold mb-4">Contact Us</h3>
          <p>Email: info@brickredsys.com</p>
          <p>Phone: +1 (425) 243-7439</p>
          <div className="flex gap-4 mt-4">
            <Link href="https://www.linkedin.com/company/brickred-systems/"><FaLinkedin /></Link>
            <Link href="https://x.com/brickredsys"><FaTwitter /></Link>
          </div>
        </div>
      </div>

      <div className="text-center mt-12 text-xs text-gray-400">
        © {new Date().getFullYear()} Brickres Systems. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';
import { Calculator, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Link } from '../UI/Link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Calculator className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold">Lease It Thailand</span>
            </div>
            <p className="text-gray-400 mb-4">
              Providing simple, transparent loan solutions to help you achieve your financial goals.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/personal-loans" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Personal Loans
                </Link>
              </li>
              <li>
                <Link href="/business-loans" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Business Loans
                </Link>
              </li>
              <li>
                <Link href="/debt-consolidation" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Debt Consolidation
                </Link>
              </li>
              <li>
                <Link href="/home-improvement" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Home Improvement
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/calculator" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Loan Calculator
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Financial Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors duration-300">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Press
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Lease It Thailand Financial Services, Inc. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">
                Terms of Service
              </Link>
              <Link href="/licenses" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">
                Licenses
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
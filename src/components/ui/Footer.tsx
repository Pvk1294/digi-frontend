
import React from 'react';
import { Logo } from './Logo';
import { Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Logo size="sm" />
            <p className="text-sm text-gray-600 max-w-xs">
              Professional CRM reporting dashboard for comprehensive ad performance analytics and client management.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Contact Info
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>support@digitalinclined.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>+91 9105138374</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Our Offices
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">🇺🇸 United States</p>
                    <p>Digital Inclined LLC MBR<br />30 Ngould St Ste R<br />Sheridan, WY 82801</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">🇮🇳 India</p>
                    <p>B-23 Ground Floor Office<br />B Block, Noida Sector 2<br />Noida – 201301</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} DigitalInclined. All rights reserved.
            </p>
            <div className="mt-2 md:mt-0 flex space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

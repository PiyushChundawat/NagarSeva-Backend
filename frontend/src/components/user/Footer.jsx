import React from "react";
import CaffieneLogo from '../../assets/Caffiene.png'

function Footer({name="NagarSeva"}){
    return(<>
        
      <footer className="relative overflow-hidden">
  
        <div className="absolute inset-0 bg-blue-900"></div>
        <div className="absolute inset-0 bg-black/50"></div>
        
       
        <div className="relative z-10">
   
          <div className="py-16">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
    
                <div className="md:col-span-2">
                  <div className="flex items-center mb-6">
                    <div className="relative group mr-4">
                     
                      <img src={CaffieneLogo} alt=""  style={{ width: "110px", height: "110px",  }}/>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-blue-500 bg-clip-text text-transparent">
                       {name}
                      </h3>
                      <p className="text-sm text-gray-300">Next-Generation Municipal Portal</p>
                    </div>
                  </div>
                </div>
                
             
                <div>
                  <h4 className="text-lg font-semibold bg-white bg-clip-text text-transparent mb-6">
                    त्वरित लिंक | Quick Links
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <a href="#" className="group flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300">
                        <div className="w-1 h-1 bg-blue-500 rounded-full group-hover:w-2 transition-all duration-300"></div>
                        <span className="text-sm">होम | Home</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="group flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300">
                        <div className="w-1 h-1 bg-green-500 rounded-full group-hover:w-2 transition-all duration-300"></div>
                        <span className="text-sm">हमारे बारे में | About us</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="group flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300">
                        <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:w-2 transition-all duration-300"></div>
                        <span className="text-sm">संपर्क | Contact</span>
                      </a>
                    </li>
                 
                  </ul>
                </div>
                
           
                <div>
                  <h4 className="text-lg font-semibold bg-white bg-clip-text text-transparent mb-6">
                    Other Links
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <a href="#" className="group flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300">
                        <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:w-2 transition-all duration-300"></div>
                        <span className="text-sm">डिजिटल इंडिया | Digital India</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="group flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300">
                        <div className="w-1 h-1 bg-blue-500 rounded-full group-hover:w-2 transition-all duration-300"></div>
                        <span className="text-sm">माय गव | MyGov</span>
                      </a>
                    </li>
                   
                    <li>
                      <a href="#" className="group flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300">
                        <div className="w-1 h-1 bg-purple-500 rounded-full group-hover:w-2 transition-all duration-300"></div>
                        <span className="text-sm">स्मार्ट सिटी | Smart City</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
       
          <div className="border-t border-gray-700/50 bg-black/30 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0">
                <div className="text-center md:text-left">
                  <p className="text-sm text-gray-300 " >
                    © 2025 भारत सरकार | Government of India. सभी अधिकार सुरक्षित | All rights reserved.
                  </p>
                  
                </div>
                
              
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-800/50 text-center">
                <p className="text-xs text-gray-500">
                  Made for {name} with ❤️ | Last Updated: October 2025 | Version 2.0.30
                </p>
                <div className="flex justify-center items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">System Status: All Services Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer></>
    )
}

export default Footer
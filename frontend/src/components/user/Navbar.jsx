import React, { useState } from "react";
import { FaBell, FaUser } from 'react-icons/fa';
import CaffieneLogo from '../../assets/Caffiene.png'
import {Link} from 'react-router-dom'

function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const Login=false
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <>
        <div className="bg-gradient-to-r from-orange-500 via-white to-green text-white py-0 md:py-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <div className="max-w-7xl mx-auto mt-1 mb-1 px-4 relative z-10">
                <div className="flex items-center justify-center space-x-4 text-center">
                   
                    <span className="text-xs text-blue-700 md:text-xs font-medium tracking-wide">
                        भारत सरकार | Government of India | Digital India 
                    </span>
                    
                </div>
            </div>
        </div>
        
        <nav className="bg-white/95 backdrop-blur-xl shadow-2xl sticky top-0 z-50 border-b border-gray-200/50 transition-all duration-300">
            <div className="max-w-8xl mx-5  px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    
                    <div className="flex items-center space-x-4">
                     
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <img src={CaffieneLogo} alt=""  style={{ width: "60px", height: "60px",  }}/>
                                <h1 className="text-2xl font-bold bg-black bg-clip-text text-transparent">
                                    NagarSeva
                                </h1>
                                
                            </div>
                            
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <div className="flex items-center space-x-3">
                            <a href="/" className="relative group px-4 py-2 text-gray-700 font-medium transition-all duration-300 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text">
                                <span className="relative z-10 p-2 group-hover:text-white group-hover:bg-black group-hover:rounded-md group-hover:opacity-80">Home</span>
                                </a>
                         
                            <Link to="/Analytics" className="relative group px-4 py-2 text-gray-700 font-medium transition-all duration-300 hover:text-transparent hover:bg-gradient-to-r hover:from-orange-600 hover:to-red-600 hover:bg-clip-text">
                                Analytics
                             </Link>
                           
                            
                            <div className="flex items-center space-x-4 ml-8 pl-8 border-l border-gray-200">
                                { Login ?
                                <div className="flex items-center space-x-4">
                                    <button className="relative p-3 text-gray-600 hover:text-blue-600 transition-all duration-300 group">
                                        <div className="absolute inset-0 bg-blue-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <FaBell className="h-5 w-5 relative z-10" />
                                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">3</span>
                                    </button>
                                    <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-blue-50 px-3 py-3 rounded-full border border-gray-200 hover:shadow-lg transition-all duration-300">
                                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center opacity-80">
                                            <FaUser className="h-4 w-4 text-white" />
                                        </div>
                                        
                                    </div>
                                </div>
                                :
                                <div className="space-x-4">
                                <Link to="/admin/login"  className="relative overflow-hidden  bg-black text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-xl hover:scale-105 group">
                                    <div className="absolute inset-0  opacity-0 group-hover:opacity-100 transition-opacity duration-300 "></div>
                                    <span className="relative z-10">Official login</span>
                                </Link>
                                <Link to="/user/login" className="relative overflow-hidden bg-orange-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-xl hover:scale-105 group">
                                    <div className="absolute inset-0  group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="relative z-10">User Login</span>
                                </Link>
                                </div>
                                }
                            </div>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-orange-600 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {/* Hamburger icon */}
                            <svg
                                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            {/* Close icon */}
                            <svg
                                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modern Mobile menu */}
            <div className={`md:hidden transition-all duration-500 ease-out ${
                isMenuOpen 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0 overflow-hidden'
            }`}>
                <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl">
                    <div className="px-6 pt-6 pb-6 space-y-4">
                        <a href="/" className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group">
                            
                            <span className="font-medium">Home</span>
                        </a>
                        <Link to="/Analytics" className="flex items-center space-x-3 text-gray-700 hover:text-green-600 py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 group">
                
                         Analytics
                        </Link>
                        
                       
                        
                        <div className="pt-4 border-t border-gray-200">
                           {Login ?
                              <a href="/My-profile" className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 py-3 px-4 rounded-xl hover:bg-blue-50 transition-all duration-300">
                                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                                    <FaUser className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-medium">My Profile</span>
                            </a>
                          :
                           <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-4 rounded-xl font-medium transition-all duration-300 hover:shadow-xl">
                                लॉगिन करें
                            </button>}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
        </>
    );
}

export default Navbar;
import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const NavBar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const dropdownRef = useRef(null)

    // Check if user is logged in
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            setIsLoggedIn(true)
            try {
                const decoded = jwtDecode(token)
                setIsAdmin(decoded.role === 'admin')
            } catch (err) {
                console.error("Token decode failed", err)
                setIsAdmin(false)
            }
        } else {
            setIsLoggedIn(false)
            setIsAdmin(false)
        }
    }, [location])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false)
            }
        }

        if (showProfileDropdown) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showProfileDropdown])

    const handleLogout = () => {
        localStorage.removeItem('token')
        setIsLoggedIn(false)
        setShowProfileDropdown(false)
        navigate('/login')
    }

    return(
        <nav className="glass-nav flex justify-between items-center px-8 py-4 shadow-md sticky top-0 z-50">
            <div className="flex-1">
                <Link to="/" className="text-white hover:text-gray-300 transition-colors">
                    <h2 className="text-2xl font-bold m-0">Slot<span className="text-indigo-50">Book</span></h2>
                </Link>
            </div>
            <div className="flex-[2] flex justify-center gap-8">
                <Link to="/" className="text-white text-base font-medium px-4 py-2 hover:bg-slate-700/40 hover:text-gray-300 transition-all">Home</Link>
                <Link to="/resources" className="text-white text-base font-medium px-4 py-2 hover:bg-slate-700/40 hover:text-gray-300 transition-all">Resources</Link>
                <Link to="/dashboard" className="text-white text-base font-medium px-4 py-2 hover:bg-slate-700/40 hover:text-gray-300 transition-all">Dashboard</Link>
                {isAdmin ? (
                    <Link to="/approvals" className="text-white text-base font-medium px-4 py-2 hover:bg-slate-700/40 hover:text-gray-300 transition-all">Approvals</Link>
                ) : (
                    <Link to="/bookslot" className="text-white text-base font-medium px-4 py-2 hover:bg-slate-700/40 hover:text-gray-300 transition-all">BookSlot</Link>
                )}
            </div>
            <div className="flex-1 flex justify-end items-center gap-4">
                {isLoggedIn ? (
                    <>
                        {/* Notification Icon */}
                        <Link to="/notifications" className="text-white hover:text-gray-300 transition-colors p-2 hover:bg-slate-700/40 relative">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {/* Optional notification badge */}
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </Link>

                        {/* Profile Icon with Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="text-white hover:text-gray-300 transition-colors p-2 hover:bg-slate-700/40 flex items-center"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showProfileDropdown && (
                                <div className="glass-panel absolute right-0 mt-2 w-48 shadow-lg z-50">
                                    <Link 
                                        to="/profile" 
                                        className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors"
                                        onClick={() => setShowProfileDropdown(false)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>My Profile</span>
                                        </div>
                                    </Link>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition-colors border-t border-gray-700"
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span>Logout</span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <Link to="/login" className="text-black bg-white hover:bg-gray-200 px-6 py-2.5 font-semibold transition-colors shadow-md">Login</Link>
                )}
            </div>
        </nav>
    )
  }
export default NavBar

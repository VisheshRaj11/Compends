import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react'
import {shadesOfPurple } from '@clerk/themes';

const Header = () => {
  const [showSignin, setShowSignin] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showBg, setShowBg] = useState(false);

  const handleOverlay = (e) => {
    if(e.target === e.currentTarget) {
        setShowSignin(false);
    }
  }

  useEffect(() => {
    if (showSignin) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [showSignin]);

   useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      if (scrollY > 40) {
        setShowBg(true);
      } else {
        setShowBg(false);
      }

      setLastScrollY(scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
}, []);


  return (
    <nav className={`w-full py-4 flex justify-between px-12 md:px-22 items-center fixed top-0 left-0 z-50 ${showBg
        ? 'bg-[#020617]/80 backdrop-blur-md border-b border-white/10 gap-x-12'
        : 'bg-transparent'
      }`}>
      <img 
      src="/logo.png" alt=""
      className='w-44 brightness-275'
      />
      <div>
        <SignedOut>
          <Button 
          onClick={() => setShowSignin(true)}
          className={'rounded-2xl border-r-3 border-t-2 border-b-2 border-blue-800 cursor-pointer bg-gradient-to-br from-[#020617] via-[#020b1f] to-[#000814] hover:text-gray-400 shadow-md  shadow-blue-800 hover:scale-105'}
          >Login</Button>
        </SignedOut>
      </div>

      {showSignin && ( 
        <div 
        onClick={handleOverlay}
        className='fixed h-screen inset-0 flex items-center justify-center bg-black/60'>
         <div>
           <SignIn
          appearance={{
            theme:[shadesOfPurple]
          }}
          forceRedirectUrl={'/community'}
          fallbackRedirectUrl={'/'}/>
         </div>
        </div>
      )}
    </nav>
  )
}

export default Header
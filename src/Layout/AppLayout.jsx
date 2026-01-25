import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LandingPage from '../pages/LandingPage/LandingPage';
import Sidebar from '../components/CommunityPage/Sidebar';
import ModernBackground from '../components/LandingPage/ModernBackground';
import { ChartArea, Flame, FolderOpenDot, Image, MessageCircle, PenBox, Video } from 'lucide-react';
import { useState } from 'react';
import { useEditUserContext } from '../context/EditContext';

const navs = [
  { icon: <MessageCircle size={20}/>, name: "Chat" },
  { icon: <Video size={20}/>, name: "Meet" },
  { icon: <Flame size={20}/>, name: "Profiles" },
  { icon: <FolderOpenDot size={20}/>, name: "Projects" },
  { icon: <ChartArea size={20}/>, name: "Ranking" },
  { icon: <PenBox size={20}/>, name: "Blog" },
  { icon: <Image size={20}/>, name: "Gallery" }
];

const AppLayout = () => {
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();
  const [active, setActive] = useState(0);
  const {isEditUser} = useEditUserContext();

  if (!isLoaded) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="animate-pulse text-slate-400">Loading experience...</div>
    </div>
  );

  if (!isSignedIn && location.pathname !== '/') {
    return <Navigate to="/" replace />;
  }

  if (isSignedIn && location.pathname === '/') {
    return <Navigate to="/community" replace />;
  }

  return (
    <div className="antialiased">
      {!isSignedIn ? (
        <div className='relative min-h-screen bg-slate-950 overflow-hidden'>
          <ModernBackground />
          <div className="relative z-10">
            <LandingPage />
          </div>
        </div>
      ) : (
        <div 
        className={`flex min-h-screen bg-[#f8fafc] text-slate-700
        `}>
          {/* Sidebar - Modernized */}
          <aside className='hidden md:block w-64 lg:w-72 border-r border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 h-screen z-50'>
            <Sidebar />
          </aside>

          {/* Main Content Area */}
          <main className={`flex-1 flex flex-col min-w-0 overflow-hidden
            ${isEditUser ? 'blur-sm brightness-dim pointer-events-none':''}`}>
            {/* Top Navigation Bar (Mobile & Desktop Quick Nav) */}
            <header className='h-16 border-b border-slate-200 bg-white/50 backdrop-blur-sm flex items-center px-6 justify-between sticky top-0 z-20'>
               <h1 className="font-bold text-xl ">
                 Community
               </h1>
               
               <nav className='flex items-center gap-2 overflow-x-auto no-scrollbar'>
                 {navs.map((nav, index) => (
                   <button
                     key={index}
                     onClick={() => setActive(index)}
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 text-sm font-medium
                       ${active === index 
                         ? 'bg-black text-white shadow-sm ring-1 ring-indigo-100' 
                         : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                   >
                     {nav.icon}
                     <span className="hidden lg:inline">{nav.name}</span>
                   </button>
                 ))}
               </nav>
            </header>

            {/* Page Content */}
            <section className='p-2 flex-1 overflow-y-auto'>
              <div className="max-w-8xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 min-h-full">
                <Outlet />
              </div>
            </section>
          </main>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
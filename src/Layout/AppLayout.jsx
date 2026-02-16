import { useUser } from '@clerk/clerk-react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import LandingPage from '../pages/LandingPage/LandingPage';
import Sidebar from '../components/CommunityPage/Sidebar';
import ModernBackground from '../components/LandingPage/ModernBackground';
import { useEffect } from 'react';
import { useEditUserContext } from '../context/EditContext';
import { ChartArea, Flame, FolderOpenDot, Image, MessageCircle, PenBox, Trophy, Video } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setCommunity } from '@/store/CommunitySlice';
import {motion} from "framer-motion";

const navs = [
{ icon: <MessageCircle size={20} />, name: "Chat", route: "chat" },
{ icon: <Video size={20} />, name: "Meet", route: "calling" },
{ icon: <FolderOpenDot size={20} />, name: "Projects", route: "projects" },
{ icon: <ChartArea size={20} />, name: "Ranking", route: "ranks" },
{ icon: <Trophy size={20} />, name: "Hackathons", route: "hackathons" },
{ icon: <PenBox size={20} />, name: "Blog", route: "blogs" },
];

const AppLayout = () => {
  const dispatch = useDispatch();
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();
  // Inside Sidebar.js mapping
  const {isEditUser} = useEditUserContext();
  const currentCommunityId = useSelector((state) => state.currentCommunity.id);

  // let idFromUrl = null; 
  // const activeId = currentCommunityId || idFromUrl;

  useEffect(() => {
    const pathSegments = location.pathname.split('/');
    const idFromUrl = pathSegments[pathSegments.length - 1];
    const staticRoutes = ['community', 'chat', 'calling', 'projects', 'ranks', 'blogs', 'gallery', 'create-community'];
    if (idFromUrl && !staticRoutes.includes(idFromUrl)) {
    dispatch(setCommunity(idFromUrl));
  }
  }, [location.pathname, dispatch])

  if (!isLoaded) return (
     <motion.div
      className="h-screen w-full flex items-center justify-center bg-slate-50 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:26px_26px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.img
        src="/logo.png"
        alt="Logo"
        className="w-40 h-auto sm:w-48 md:w-64 lg:w-80"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
          scale: { type: "spring", damping: 10, stiffness: 100 }
        }}
      />
    </motion.div>
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
                 {navs.map((nav, index) => {
                  const pathSegments = location.pathname.split('/');
                  const idFromUrl = pathSegments[pathSegments.length - 1]; 
                  const activeId = currentCommunityId || idFromUrl;
                  return (
                    <NavLink
                    key={index}
                    to={currentCommunityId ? `/community/${nav.route}/${activeId}` : "#"}
                    className={({ isActive }) => `
                      flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 text-sm font-medium
                      ${isActive 
                        ? 'bg-black text-white shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
                    `}
                  >
                    {nav.icon}
                    <span className="hidden lg:inline">{nav.name}</span>
                  </NavLink>
                  )
                 })}
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
import { UserButton, useUser } from '@clerk/clerk-react'
import { shadesOfPurple } from '@clerk/themes';
import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button';
import { PlusCircle, Users, EllipsisVertical, Hash, PencilIcon } from 'lucide-react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useSupabase} from '../../supabase/client'
import EditUserForm from './EditUserForm';
import { useEditUserContext } from '../../context/EditContext';

const Sidebar = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [communities, setCommunities] = useState([]);
  const {isEditUser, openEdit, closeEdit} = useEditUserContext();
  const supabase = useSupabase();
  useEffect(() => {
    const fetchCommunities = async () => {
      const { error, data } = await supabase.from("communities").select('*');
      if (error) return;
      setCommunities(data);
    }
    fetchCommunities()
  }, [supabase])


  const overlay = (e) => {
    if(e.target === e.currentTarget) {
        closeEdit();
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 border-r border-slate-200 ">
      {/* User Profile Section */}
      <div className="p-4 mb-2">
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white shadow-sm border border-slate-100">
          <div className='flex gap-3'>
              <UserButton
              appearance={{
                baseTheme: shadesOfPurple,
                elements: { avatarBox: "w-10 h-10" }
              }}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Pro Member</span>
            </div>
          </div>
           <Button 
            onClick={openEdit}
            variant="ghost" 
            size="icon"
            className="h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
          >
            <PencilIcon size={16} className="text-slate-600" />
          </Button>
        </div>
      </div>

   {isEditUser && (
        <div 
        className="fixed top-0 left-0 w-screen h-screen z-40">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
          />

          {/* Modal */}
          <div 
          onClick={overlay}
          className="relative z-10 flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
              <EditUserForm/>
            </div>
          </div>
        </div>
      )}


      {/* Action Section */}
      <div className="px-4 mb-6">
        <Button
          onClick={() => navigate('/community/create-community')}
          className="w-full justify-start gap-2 text-white shadow-md py-6 rounded-xl transition-all active:scale-[0.98]"
        >
          <PlusCircle size={18} />
          <span className="font-medium">New Community</span>
        </Button>
      </div>

      {/* Navigation / Communities List */}
      <div className={`flex-1 px-3 overflow-y-auto`}>
        <div className="flex items-center justify-between px-3 mb-3">
          <h3 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">
            Your Communities
          </h3>
          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
            {communities.length}
          </span>
        </div>

        <div className="space-y-1">
          {communities.map((community) => (
            <NavLink
              key={community.id}
              to={`/community/${community.id}`}
              className={({ isActive }) => `
                group flex items-center justify-between p-2 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100' 
                  : 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-900'}
              `}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`
                  p-2 rounded-md transition-colors
                  ${location.pathname === `/community/${community.id}` 
                    ? 'bg-indigo-100 text-indigo-600' 
                    : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 '}
                `}>
                  <Users size={16} />
                </div>
                <span className="text-sm font-medium truncate">
                  {community.name}
                </span>
              </div>
              
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 transition-opacity">
                <EllipsisVertical size={14} />
              </button>
            </NavLink>
          ))}

          {communities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400 italic">No communities joined yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
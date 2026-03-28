import { UserButton, useUser } from '@clerk/clerk-react'
import { shadesOfPurple } from '@clerk/themes';
import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button';
import { PlusCircle, Users, EllipsisVertical, PencilIcon, Pen, Trash, Info, Cross, X, Loader2, User} from 'lucide-react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useSupabase} from '../../supabase/client'
import EditUserForm from './EditUserForm';
import { useEditUserContext } from '../../context/EditContext';
import { useDispatch } from 'react-redux';
import { clearCommunity, setCommunity } from '@/store/CommunitySlice';
import {toast} from "react-toastify";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from "zod";
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

const Sidebar = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [communities, setCommunities] = useState([]);
  const {isEditUser, openEdit, closeEdit} = useEditUserContext();
  const [currentCommunityInfo, setCurrentCommunityInfo] = useState({}) || {};
  const supabase = useSupabase();
  const dispatch = useDispatch();
  const [openMenu, setOpenMenu] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [isEditCommunity, setIsEditCommunity] = useState(false);

  // const isThisCommunityActive = location.pathname.includes(community.id);

  const formSchema = z.object({
    communityName: z.string().min(3, "Community name must be at least 3 characters"),
    about: z.string().min(4, "About must be at least 4 characters").max(50, "About must be within 50 characters"),
  })

  let form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      communityName: "",
      about: "",
    }
  })
  
  useEffect(() => {
    const fetchCommunities = async () => {
      const { error, data } = await supabase.from("communities").select('*');
      if (error) return;
      console.log(data);
      setCommunities(data);
    }
    fetchCommunities()
  }, [supabase]);

  useEffect(() => {
    if(currentCommunityInfo?.name) {
      form.reset({
        communityName:currentCommunityInfo.name || "",
        about: currentCommunityInfo.about || "",
      });
    }
  },[currentCommunityInfo])

  useEffect(() => {
    if(!activeId) return;
    console.log(activeId);
    const fetchInfo = async() => {
        const {data, error} = await supabase.from('communities').select("*").eq('id',activeId).single();
        if(error) {
          throw new Error(error);
        }
        // console.log(data[0]);
        setCurrentCommunityInfo(data[0])
        // setCurrentCommunityInfo(data)
    }
    fetchInfo();
  },[activeId])


  const overlay = (e) => {
    if(e.target === e.currentTarget) {
        closeEdit();
    }
    if(openMenu) setOpenMenu(false);
  }

  const handleDelete = async() => {
    const currentId = activeId;
    try {
      const {error} = await supabase.from('communities').delete().eq('id', currentId);
      if(error) {
        toast.error("Failed to delete community");
        throw new Error(error);
      }
      toast.success("Community deleted successfully")
    } catch (error) {
      console.log("Failed to delete community: ", error);
    }
  }

  const onSubmit = async (values) => {
  const currentId = activeId;

  try {
    const { error } = await supabase
      .from('communities')
      .update({
        name: values.communityName,
        about: values.about,
      })
      .eq('id', currentId);

    if (error) {
      toast.error("Failed to update community");
      throw new Error(error.message);
    }

    toast.success("Community updated successfully");
    setOpenMenu(false);
    setIsEditCommunity(false); 
  } catch (error) {
    console.log(error);
  }
};

useEffect(() => {
  if(!activeId) return ;
  const channel = supabase
      .channel(`community-${activeId}`)
      .on("postgres_changes",{
        event: "*",
        schema: "public",
        table: "communities",
        filter: `id=eq.${activeId}`,
      },
      (payload) => {
        // console.log(payload);
        if(payload.eventType === "INSERT") {
          setCommunities((prev) => [...prev, payload.new]);
        }
        if(payload.eventType === "UPDATE") {
          setCommunities((prev) => (
            prev.map((item) => item.id === payload.old.id ? payload.new : item)
          ))
        }
        if(payload.eventType === "DELETE") {
          setCommunities((prev) => prev.filter((item) => item.id !== payload.old.id));
        }
      }
    ).subscribe((status) => console.log(status)
  );

  return () => supabase.removeChannel(channel);
},[activeId])


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
            onClick={() => navigate('/community/userProfile')}
            variant="ghost" 
            size="icon"
            className="h-8 w-8 rounded-full border-slate-200 bg-slate-100 hover:bg-slate-100 cursor-pointer"
          >
            <User 
            size={16} className="text-slate-600" />
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

      {
        isEditCommunity && (
          <div className="fixed w-screen inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4">
  <Form {...form}>
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="w-full max-w-md sm:max-w-md bg-white rounded-lg shadow-2xl p-4 sm:p-6 space-y-5"
    >
      <div className='flex justify-between items-center'>
        <h2 className="text-black text-center text-lg sm:text-xl font-semibold">
             Update Community
        </h2>
        <span 
        onClick={() => setIsEditCommunity(false)}
        className='cursor-pointer'><X size={18}/></span>
      </div>

      <FormField
        control={form.control}
        name="communityName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              Community Name
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tech Squad"
                  className="pl-9 text-sm sm:text-base"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="about"
        render={({ field }) => (
          <FormItem> <Button 
            onClick={() => navigate('userProfile')}
            variant="ghost" 
            size="icon"
            className="h-8 w-8 rounded-full border-slate-200 bg-slate-100 hover:bg-slate-100 cursor-pointer"
          >
            <User 
            size={16} className="text-slate-600" />
          </Button>
            <FormLabel className="text-sm font-medium">
              Description
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  placeholder="What's this group about?"
                  className="pl-9 text-sm sm:text-base"
                  {...field}
                />
              </div>
            </FormControl>
            <FormDescription className="text-xs">
              Keep it short and catchy.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button
        type="submit"
        className="w-full font-semibold shadow-lg hover:shadow-primary/20 transition-all active:scale-95 text-sm sm:text-base"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className='animate-spin'/>
            Updating...
          </>
        ) : (
          "Update Community"
        )}
      </Button>
    </form>
  </Form>
</div>
        )
      }

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
          {communities.map((community) => {
            // Check if the community ID exists anywhere in the current URL path
            const isThisCommunityActive = location.pathname.includes(community.id);

            return (
              <NavLink
                key={community.id}
                onClick={() => { dispatch(setCommunity(community.id)); }}
                to={`/community/chat/${community.id}`}
                className={`
                  group flex items-center justify-between p-2 rounded-lg transition-all duration-200
                  ${isThisCommunityActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100' 
                    : 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-900'}
                `}
              >
                <div 
                // onClick={overlay}
                className="flex items-center gap-3 min-w-0 relative">
                    {activeId === community.id && openMenu && (
                    <ul className=' flex flex-col gap-1 border absolute bg-white top-0 -right-20 z-10 py-3 px-2 rounded-xl'>
                      <li 
                      onClick={() => setIsEditCommunity(prev => !prev)}
                      className='flex items-center gap-2 cursor-pointer bg-black text-white hover:bg-gray-300/10 hover:text-indigo-700 hover:border hover:border-gray-400 rounded px-5 py-2'>
                        <span><Pen size={14}/></span>
                        <p className='text-sm'>Edit</p>
                      </li>
                      <li 
                      onClick={handleDelete}
                      className='flex items-center gap-2 cursor-pointer bg-black text-white hover:bg-gray-300/10 hover:text-indigo-700 transition duration-500 hover:border hover:border-gray-400 rounded px-5 py-2'> 
                        <span><Trash size={14}/></span>
                        <p className='text-sm'>Delete</p>
                      </li>
                    </ul>
                  )}
                  <div className={`
                    p-2 rounded-md transition-colors
                    ${isThisCommunityActive 
                      ? 'bg-indigo-100 text-indigo-600' 
                      : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50'}
                  `}>
                    <Users size={16} />
                  </div>
                  <span className="text-sm font-medium truncate">
                    {community.name}
                  </span>
                </div>
                
                <button 
                onClick={() => { setOpenMenu(prev => !prev); setActiveId(community.id)}}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 transition-opacity cursor-pointer">
                  <EllipsisVertical size={14} />
                </button>
              </NavLink>
            );
          })}

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
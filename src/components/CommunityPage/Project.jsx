import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  LayoutGrid, 
  ArrowUpRight, 
  Folder, 
  Sparkles, 
  X,
  Loader2 
} from "lucide-react"
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Input } from "../ui/input"
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSupabase } from '@/supabase/client'
import { useUser } from '@clerk/clerk-react'

const schema = z.object({
  title: z.string().min(5, "Title too short"),
  description: z.string().min(10, "Description too short")
})

const ProjectDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const communityId = location.pathname.split('/').at(-1);
  const supabase = useSupabase();
  const [currentUserId, setCurrentUserId] = useState(null);
  const {user} = useUser();
  const [projects, setProjects] = useState([]);
  const channelRef = useRef(null);
  
  // const projects = [
  //   { id: 1, title: "Smart Campus", desc: "IoT based tracking system for university" },
  //   { id: 2, title: "CloudWings", desc: "Medical drone delivery platform" },
  // ];

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "" }
  });

  useEffect(() => {
  if (!user?.id) return;

  const fetchUser = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (error) {
      console.error(error);
      return;
    }
    setCurrentUserId(data[0].id); 
  };

  fetchUser();
}, [user?.id]);

//   useEffect(() => {
//   if (!currentUserId) return;

//   const signInSupabase = async () => {
//     const { error } = await supabase.auth.signInWithIdToken({
//       provider: "custom",
//       token: currentUserId, // 👈 MUST be a UUID that exists in auth.users
//     });

//     if (error) {
//       console.error("Supabase auth error:", error);
//     }
//   };

//   signInSupabase();
// }, [currentUserId]);

useEffect(() => {
    const fetchProject = async() => {
      const {data, error} = await supabase.from('projects').select("*").eq('community_id', communityId).order("created_at",{ascending:false});
      
      if(error) {console.log("Error fetching projects"); return;}
      
      setProjects(data);
    }
    fetchProject();
},[supabase, communityId]);

// Testing Channel:
// useEffect(() => {
//   const channel = supabase
//     .channel("hard-proof")
//     .on(
//       "postgres_changes",
//       { event: "*", schema: "public", table: "*" },
//       (payload) => {
//         console.log("🔥 EVENT FIRED:", payload);
//       }
//     )
//     .subscribe((status) => {
//       console.log("📡 STATUS:", status);
//     });

//   return () => supabase.removeChannel(channel);
// }, []);


// Now this is realtime  fetching with channel:
useEffect(() => {
    
    if(!communityId) return;
    if(channelRef.current) return;
    
    channelRef.current = supabase.channel(`projects-community-${communityId}`)
    .on("postgres_changes",{
      event:"INSERT",
      schema: 'public',
      table:'projects',
      filter: `community_id=eq.${communityId}`
    },
    (payload) => {
      console.log("Insert: ", payload.new);
      setProjects((prev) => {
        if(prev.some((p) => p.id === payload.new.id)) return prev;
        return [payload.new, ...prev];
      });
    }
  ).subscribe((status) => console.log(status));

  // window.location.reload();

  return () => {
    if(channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }
},[communityId, supabase]);
  
 const onSubmit = async (values) => {
  try {
    // console.log(currentUser+" "+communityId+" "+values.title+" "+values.description)
    const { error } = await supabase.from("projects").insert({
      title: values.title,
      description: values.description,
      creator_id: currentUserId,
      community_id: communityId,
    });

    if (error) {
      console.log(error.message);
      return;
    }

    alert("Project created successfully ✨");
    setIsModalOpen(false);
    form.reset();

    // TODO: Have to do correction in realtime channeling:
    navigate(0);
    // Optional: Refresh your project list here if not using real-time
  } catch (err) {
    console.error("Supabase Insertion Error:", err);
    // alert(`Failed to create project: ${err.message}`);
  }
};

  return (
    <div className="relative min-h-screen w-full bg-white bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:26px_26px] p-6 md:p-10">
      
      {/* Header Section */}
      <div className="mb-10 relative">
        <h1 className="text-3xl font-semibold text-gray-900">Workspace</h1>
        <p className="text-gray-500 font-bold">Manage and initialize your project builds.</p>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
        
        {/* ITEM START: Create Project Trigger */}
        <motion.div
          whileHover={{ scale: 1.01, translateY: -4, translateX: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="group relative rounded-xl cursor-pointer border-[3px] border-black bg-white p-8 h-[250px] flex flex-col items-center justify-center transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="p-4 bg-black text-white rounded-xl group-hover:rotate-90 transition-transform duration-300">
            <Plus className="w-8 h-8" />
          </div>
          <span className="mt-4 font-bold text-sm text-black">New Build</span>
        </motion.div>

        {/* Mapped Existing Projects */}
        {projects.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 rounded-xl border-black/10 bg-white/60 backdrop-blur-[2px] p-6 h-[250px] flex flex-col justify-between hover:border-black transition-all group hover:shadow-md cursor-pointer"
          >
            <Link
            to={`/community/projects/page/${communityId}/${project.id}`}
            >
              <div className="flex justify-between items-start">
                <Folder className="w-6 h-6 text-gray-400 group-hover:text-black transition-colors" />
                <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" />
              </div>
              <h3 className="mt-4 font-bold text-lg text-gray-900 hover:underline underline-offset-4 decoration-2">{project.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mt-2">{project.description}</p>
            </Link>
            <div className="text-[10px] font-medium text-gray-400">
              Project ID: 00{project.id}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Fullscreen Form Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-white/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-white border-[3px] border-black p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] rounded-xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="absolute right-6 top-6 hover:rotate-90 transition-transform p-1"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>

              <div className="mb-8">
                <div className="inline-block p-2 bg-black text-white rounded-lg mb-4">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Project Configuration</h2>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-gray-700">Project Name</FormLabel>
                        <FormControl>
                          <Input 
                            className="rounded-lg border-2 border-gray-100 focus:border-black focus-visible:ring-0 font-medium h-12 bg-gray-50/50" 
                            placeholder="Enter project title" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-gray-700">Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="rounded-lg border-2 border-gray-100 focus:border-black focus-visible:ring-0 min-h-[120px] resize-none bg-gray-50/50" 
                            placeholder="Briefly describe the project goals..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={form.formState.isSubmitting} 
                    className="w-full h-14 bg-black text-white hover:bg-gray-800 rounded-lg font-bold transition-all active:scale-95 shadow-lg"
                  >
                    {form.formState.isSubmitting ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        Initialize Build
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProjectDashboard;
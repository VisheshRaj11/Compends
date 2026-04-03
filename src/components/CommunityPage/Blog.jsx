import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Image, Search, X, Users, Info, PlusCircle, Loader2, ArrowUpRight, Trash, Edit, MoveRight, MoveDown, MoveUpIcon, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from "zod";
import { FormControl, FormField, FormItem, FormLabel, Form, FormMessage, FormDescription } from '../ui/form';
import { uploadFile } from '@/utils/UploadFile';
import { useSupabase } from '@/supabase/client';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
// import { b } from 'node_modules/@clerk/clerk-react/dist/useAuth-BfjxAfMb.mjs';
// import { stat } from 'node:fs';

const formSchema = z.object({
  title: z.string().min(3, "Community name must be at least 3 characters"),
  description: z.string().min(4, "About must be at least 4 characters"),
  image: z.instanceof(File)
    .refine(file => file.type.startsWith('image/'), {
      message: "Only image files are allowed"
    }),
});
const editFormSchema = z.object({
  title: z.string().min(3, "Community name must be at least 3 characters"),
  description: z.string().min(4, "About must be at least 4 characters"),
});

const Blog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = useSupabase();
  const { id: communityId, blog_id: blogId } = useParams();
  const { user } = useUser();
  const [allBlogs, setAllBlogs] = useState([]);
  const navigate = useNavigate();
  const [blogMenu, setBlogMenu] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentBlogInfo, setCurrentBlogInfo] = useState(null);
  
  const form = useForm({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      title: "",
      description: "",
      image: undefined,
    }
  });

  const editForm = useForm({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      title: currentBlogInfo?.title ||  "",
      description: currentBlogInfo?.content || "",
      // image: undefined,
    }
  })

  const fetchBlogs = async () => {
    // console.log(communityId)
    const { data, error } = await supabase.from('blogs')
      .select('*').eq('community_id', communityId).order('created_at', { ascending: false });

    if (error) {
      console.log(error.message);
      return;
    }

    console.log(data);
    setAllBlogs(data);
  }

  const onSubmit = async (values) => {
    if (!values) return;
    setIsSubmitting(true);
    try {
      // Ensure uploadFile returns the PUBLIC URL
      const { url } = await uploadFile(values.image, supabase);
      
      const { error } = await supabase.from('blogs').insert({
        community_id: communityId, 
        author_id: user.id, 
        title: values.title, 
        image: url, 
        content: values.description
      });
      
      if (error) {
        console.log("Blog uploading error: ", error.message);
        return;
      }
      
      toast.success("Blog Uploaded successfully");
      form.reset();
      fetchBlogs(); // Refresh list immediately after upload
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async() => {
    const currentId = activeMenuId;
    try {
      const {error} = await supabase.from('blogs')
      .delete().eq('id', currentId);
      if(error) throw new Error(error);
      toast.success("Blog deleted successfully");
      activeMenuId(null);
    } catch (error) {
      console.log(error);
    }
  }

  const handleEdit = async(values) => {
     try {
      const currentId = activeMenuId;

      const {error} = await supabase.from('blogs')
      .update({
        title:values.title,
        content: values.description
      }).eq('id',currentId);

      if(error) throw new Error(error);
      
      setAllBlogs((prev) => prev.map((blog) => 
        blog.id === currentId? {...blog, title: values.title, content: values.description} : blog
      ))

      editForm.reset();

      setActiveMenuId(null);

      setIsEditOpen(false);
      
      toast.success('Blog updated successfully');
     } catch (error) {
       console.log(error);
     }
  }
  
  useEffect(() => {
    fetchBlogs();
  }, [supabase, communityId]);


  //If we dont do this. Exisiting value of the blog can't shown because the data is fetched asyncronously
  //when the data is load , the editForm had been initialized already as a result null value.
  useEffect(() => {
  if (currentBlogInfo) {
    editForm.reset({
      title: currentBlogInfo.title,
      description: currentBlogInfo.content,
    });
  }
}, [currentBlogInfo]);

  //Fetch current edit triggered blog:
  useEffect(() => {
    if(!activeMenuId) return ;
    const currentId = activeMenuId;
    const fetchCurrentBlogInfo = async() => {
      try {
         const {data, error} = await supabase.
        from('blogs').select('*').eq('id',currentId).single();
        
        if(error) throw new Error(error);

        // console.log(data[0]);
        setCurrentBlogInfo(data[0]);
        // console.log(currentBlogInfo?.title);
      } catch (error) {
        console.log(error);
      }
    }
    fetchCurrentBlogInfo();
  },[activeMenuId])

  useEffect(() => {
    const channel = supabase.channel(`community-${communityId}`)
    .on('postgres_changes',{
      event: '*',
      schema: 'public',
      table: 'blogs',
      // filter : `community_id=eq.${String(communityId)}`
    },
  (payload) => {
  console.log("Realtime payload:", payload);

  if (payload.eventType === "INSERT") {
    setAllBlogs(prev => [payload.new, ...prev]);
  }

  if (payload.eventType === "DELETE") {
    setAllBlogs(prev =>
      prev.filter((p) => p.id !== payload.old.id)
    );
  }

  if (payload.eventType === "UPDATE") {
    setAllBlogs(prev =>
      prev.map((p) =>
        p.id === payload.new.id ? payload.new : p
      )
    );
  }
}
).subscribe();

  return () => supabase.removeChannel(channel);
  
  },[communityId]);

  return (
    (blogId ? (
      <Outlet/>
    ) 
    : 
    (
      <div className="flex h-screen w-full bg-gradient-to-br from-white to-slate-100 bg-[radial-gradient(#d622b5_1px,transparent_1px)] [background-size:26px_26px] overflow-hidden relative rounded-xl">

      {/* LEFT SIDE: Create Blog Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none lg:relative
          ${isOpen ? 'w-[85vw] sm:w-[400px] translate-x-0' : 'w-0 -translate-x-full'}`}
      >
        <div className={`w-[85vw] sm:w-[400px] p-6 h-full flex flex-col ${!isOpen && 'invisible'}`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-800">New Entry</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto pr-2">
            <Form {...form} >
              <form className='space-y-10' onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Title..." className="pl-9" {...field} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Textarea rows={5} placeholder="Share your blog" className="pl-9 overflow-y-scroll resize-none" {...field} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Choose Thumbnail</FormLabel>
                      <FormControl>
                        <div>
                          <Input
                            id="image"
                            type="file"
                            accept='image/*'
                            className="hidden"
                            onChange={(e) => field.onChange(e.target.files?.[0])}
                            ref={field.ref} />
                          <FormLabel
                            htmlFor="image"
                            className="cursor-pointer rounded-md border px-4 py-2 text-sm hover:bg-muted border-dashed border-blue-500 p-5 block">
                            <div className='flex gap-2 items-center justify-center text-center'>
                              <PlusCircle size={18} />
                              <p>Upload Image</p>
                            </div>
                          </FormLabel>

                          {field.value && (
                            <p className="mt-2 text-sm text-muted-foreground text-center line-clamp-1">
                              {field.value.name}
                            </p>
                          )}
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : "Share"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </aside>

      {/* RIGHT SIDE: Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <nav className="h-16 border-b bg-white/80 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {!isOpen && (
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            )}
            <div className="relative w-48 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-9 h-9 bg-slate-100/50 border-transparent focus:bg-white transition-all" placeholder="Search..." />
            </div>
          </div>
          <div className="h-8 w-8 rounded-full bg-indigo-100 border border-indigo-200" />
        </nav>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <header className="mb-10">
              <h1 className="text-2xl md:text-4xl font-extrabold text-blue-900 tracking-tight">Recent Publications</h1>
              <p className="text-slate-500 mt-2">Manage and view your blog workspace.</p>
            </header>

            {allBlogs.length !== 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
  {allBlogs.map((blog) => (
    <div
      key={blog.id}
      className="group flex flex-col bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* IMAGE */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={blog.image}
          alt={blog.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src =
              "https://placehold.co/600x400?text=Image+Not+Found";
          }}
        />
      </div>

      {/* CONTENT */}
      <div className="p-5 flex flex-col min-h-[230px]">
        <h2 className="text-lg font-bold text-slate-800 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">
          {blog.title}
        </h2>

        <p className="text-slate-600 text-sm line-clamp-3 mb-4">
          {blog.content}
        </p>

        {/* FOOTER */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium">
            {new Date(blog.created_at).toLocaleDateString()}
          </span>

          <Button
            onClick={() =>
              navigate(
                `/community/blogs/${communityId}/viewBlog/${blog.id}`
              )
            }
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-blue-600 cursor-pointer"
          >
            View <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        </div>

        {/* TOGGLE BUTTON */}
        <Button
          onClick={() =>
            setActiveMenuId(
              activeMenuId === blog.id ? null : blog.id
            )
          }
          className="mt-2 mb-2 bg-gray-500/20 hover:bg-gray-500/30 text-black"
        >
          {activeMenuId === blog.id ? (
            <MoveUpIcon size={18} />
          ) : (
            <MoveDown size={18} />
          )}
        </Button>

        {/* ACTION MENU */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out
          ${activeMenuId === blog.id ? "max-h-20 mt-2" : "max-h-0"}`}
        >
          <div
            className={`flex justify-center gap-2 transition-all duration-300
            ${
              activeMenuId === blog.id
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2"
            }`}
          >
            <Button 
            onClick={handleDelete}
            className="w-1/2 cursor-pointer">
              <Trash size={18} />
            </Button>

            <Button 
            onClick={() => setIsEditOpen(prev => !prev)}
            className="w-1/2 cursor-pointer">
              <Edit size={18} />
            </Button>
          </div>

          {isEditOpen && (
            //  <div className="flex-1 space-y-5 overflow-y-auto pr-2">
            <div className="fixed w-screen inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4">
              <Form {...editForm}>
                <form
                  onSubmit={editForm.handleSubmit(handleEdit)}
                  className="w-full max-w-md sm:max-w-md bg-white rounded-lg shadow-2xl p-4 sm:p-6 space-y-5"
                >
                  <div className='flex justify-between items-center'>
                    <h2 className="text-black text-center text-lg sm:text-xl font-semibold">
                        Update Blog
                    </h2>
                    <span 
                    onClick={() => {setIsEditOpen(false); setActiveMenuId(null);}}
                    className='cursor-pointer'><X size={18}/></span>
                  </div>

                  <FormField
                    control={editForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Community Name
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder=""
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
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem> 
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
                    className="w-full font-semibold shadow-lg hover:shadow-primary/20 transition-all active:scale-95 text-sm sm:text-base cursor-pointer"
                    disabled={editForm.formState.isSubmitting}
                  >
                    {editForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className='animate-spin'/>
                        Updating...
                      </>
                    ) : (
                      "Update Blog"
                    )}
                  </Button>
                </form>
              </Form>
            {/* </div> */}
          </div>
          )}
        </div>
      </div>
    </div>
  ))}
</div>
            ) : (
              <div className="h-70 flex items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300 mt-28">
                <p className="text-slate-500">No blogs exist in this community yet.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Background Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      {/* <Outlet/> */}
    </div>
    ))
  );
};

export default Blog;
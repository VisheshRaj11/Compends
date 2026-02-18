import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Image, Search, X, Users, Info, PlusCircle, Loader2, ArrowUpRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from "zod";
import { FormControl, FormField, FormItem, FormLabel, Form } from '../ui/form';
import { uploadFile } from '@/utils/UploadFile';
import { useSupabase } from '@/supabase/client';
import { useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

const formSchema = z.object({
  title: z.string().min(3, "Community name must be at least 3 characters"),
  description: z.string().min(4, "About must be at least 4 characters"),
  image: z.instanceof(File)
    .refine(file => file.type.startsWith('image/'), {
      message: "Only image files are allowed"
    }),
});

const Blog = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = useSupabase();
  const { id: communityId } = useParams();
  const { user } = useUser();
  const [allBlogs, setAllBlogs] = useState([]);

  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      image: undefined,
    }
  });

  const fetchBlogs = async () => {
    const { data, error } = await supabase.from('blogs')
      .select('*').eq('community_id', communityId).order('created_at', { ascending: false });

    if (error) {
      console.log(error.message);
      return;
    }
    setAllBlogs(data);
  }

  const onSubmit = async (values) => {
    if (!values) return;
    setIsSubmitting(true);
    try {
      // Ensure uploadFile returns the PUBLIC URL
      const { url } = await uploadFile(values.image, communityId, supabase);
      
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
      
      alert("Blog Uploaded successfully");
      form.reset();
      fetchBlogs(); // Refresh list immediately after upload
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    fetchBlogs();
  }, [supabase, communityId])

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden relative">

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
                          <Textarea rows={10} placeholder="Share your blog" className="pl-9" {...field} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allBlogs.map((blog) => (
                  <div key={blog.id} className="group flex flex-col bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                      <img 
                        src={blog.image} 
                        alt={blog.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found'; }}
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="text-lg font-bold text-slate-800 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">
                        {blog.title}
                      </h2>
                      <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">
                        {blog.content}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(blog.created_at).toLocaleDateString()}
                        </span>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
                          View <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
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
    </div>
  );
};

export default Blog;
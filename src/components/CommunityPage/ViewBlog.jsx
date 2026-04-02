import { useSupabase } from '@/supabase/client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Book, User } from 'lucide-react';
import './ViewBlog.css'

const ViewBlog = () => {
  const { id: communityId, blog_id: blogId } = useParams();
  const supabase = useSupabase();
  const [blogInfo, setBlogInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorInfo, setAuthorInfo] = useState(null);

  useEffect(() => {
    const fetchBlogInfo = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('id', blogId)
          .single();

        if (error) throw error;

        const blog = data[0];

        setBlogInfo(blog);

        const {data:authorData, error:authorError} = await supabase.from('users')
        .select('*').eq('clerk_id',blog.author_id).single();

        if (authorError) throw authorError;

        console.log("Author Data: ",authorData);

        setAuthorInfo(authorData[0]); 
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogInfo();
  }, [blogId, communityId]);

  if (loading) {
    return (
      <div className="w-full p-6 space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
  <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 md:px-10 py-10 rounded-2xl bg-[radial-gradient(#d622b5_1px,transparent_1px)] [background-size:26px_26px]">
    
    {/* Container */}
    <div className="max-w-6xl mx-auto">
      
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-3 flex items-center gap-x-2">
        <Book size={18}/>{blogInfo?.title}
      </h1>

      {/* Author */}
      <p className="text-muted-foreground mb-10 text-sm md:text-base flex items-center gap-1 bg-emerald-500/40 rounded p-1 text-emerald-600 w-fit">
        <User size={18}/>
        By{" "}
        <span className="font-medium text-foreground ">
          {authorInfo?.name
            .split(" ")
            .map((n) => n[0].toUpperCase() + n.slice(1))
            .join("") || "Communtiy Member"} 
        </span>
      </p>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Image */}
        {blogInfo?.image && (
          <div className="w-full h-[250px] md:h-[420px] overflow-hidden rounded-2xl shadow-md group">
            <img
              src={blogInfo.image}
              alt={blogInfo.title}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        {/* Content */}
        <div className="w-full">
          <div className="prose prose-neutral dark:prose-invert max-w-none text-base font-semibold md:text-lg leading-relaxed bg-background/60 backdrop-blur-md border border-border rounded-2xl p-5 md:p-6 shadow-sm h-[400px] md:h-[420px] overflow-y-auto" id='content'>
            {blogInfo?.content}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default ViewBlog;
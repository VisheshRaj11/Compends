import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "framer-motion"
import { Users, Info, PlusCircle, Loader2 } from "lucide-react"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '../../components/ui/form'
import { Button } from '../../components/ui/button'
import { Input } from "../../components/ui/input"
import { Textarea } from '../../components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card"
import { Spinner } from '../../components/ui/spinner'
import { useSupabase} from '../../supabase/client'
import { useUser } from '@clerk/clerk-react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const formSchema = z.object({
  communityName: z.string().min(3, "Community name must be at least 3 characters"),
  about: z.string().min(4, "About must be at least 4 characters").max(50, "About must be within 50 characters"),
  size: z.number().min(1, "Must be at least 1 member"),
})

const CommunityForm = () => {
  const {user} = useUser()
  const supabase = useSupabase();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  // const [insertData, setInsertData] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      communityName: "",
      about: "",
      size: 1,
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
  

  const onSubmit = async (values) => {
    try {
      const {error, data} = await supabase.from("communities").insert({
        name:values.communityName.trim(),
        about: values.about.trim(),
        size: values.size,
        owner_id: user.id
    }).select();

    if(error) {
      console.log("Supabse Error: "+error.message);
      return;
    }
    console.log(data);
    toast.success("Community created successfully");

    setTimeout(() => {
      navigate(0);
      navigate(`/community/chat/${communities[0]?.id}`);
    },3 * 1000);
    // alert("Community created!")
    // setInsertData(data);
    // console.log("Form Values:", values)
    } catch (error) {
      console.log(error);
    }
  }

  // useEffect(() => {
  //   const channel = supabase.channel(`community_id:${Date.now()}`)
  //   .on('postgres_changes',{
  //     event:'*',
  //     schema: 'public',
  //     table:'communities',
  //     filter:``
  //   })
  // })

  return (
    <div className="flex items-center bg-[url('/comBg.jpg')] justify-center h-screen p-4 w-full">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PlusCircle className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">New Community</CardTitle>
            </div>
            <CardDescription>
              Set up your community workspace in seconds.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="communityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Community Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Tech Squad" className="pl-9" {...field} />
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
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Description</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Textarea placeholder="What's this group about?" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">Keep it short and catchy.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Initial Member Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full font-semibold shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Spinner />
                      Creating...
                    </>
                  ) : "Create Community"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default CommunityForm
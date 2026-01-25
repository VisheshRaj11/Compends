import React from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../ui/input'
import { Github, Linkedin, Trophy, UserCircle, Save, X } from 'lucide-react'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import * as z from "zod";
import { useEditUserContext } from '../../context/EditContext'
import { useSupabase} from '../../supabase/client'
import { useUser } from '@clerk/clerk-react'


const urlField = z
.string()
.trim()
.optional()
.refine(
    (val) => !val || /^https?:\/\/.+\..+/.test(val),
    "Must be a valid URL"
)

const formSchema = z.object({
    github: urlField,
    linkedin: urlField,
    leetcode: urlField,
    about: z
    .string()
    .max(300, "About must be under 300 characters")
    .optional()
})

const EditUserForm = () => {
    const {closeEdit} = useEditUserContext();
    const {user}  = useUser();
    const supabase = useSupabase();
    const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
        github: "",
        linkedin: "",
        leetcode: "",
        about: ""
    }
  })

  const onSubmit = async(values) => {
    console.log(values);
    const {error} = await supabase.from('users').insert(
        {clerk_id:user?.id,
         name:user?.firstName || "",
         email:user?.emailAddresses[0]?.emailAddress || "",
         github:values.github,
         linkedin:values.linkedin,
         leetcode: values.leetcode,
         about:values.about,
         avatar_url:user?.imageUrl
        }
    )
    if(error) {
        console.log("Edit user error: "+error.message);
        return;
    }
    alert('Profile updated successfully');
    closeEdit();
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 bg-card border rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Set Your Info</h1>
          <p className="text-sm text-muted-foreground">Update your social profiles and bio.</p>
        </div>
        <UserCircle className="w-10 h-10 text-primary/20" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Github Field */}
            <FormField
              control={form.control}
              name="github"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-muted-foreground" /> Github
                  </FormLabel>
                  <FormControl>
                    <Input className="bg-background" placeholder="https://github.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* LinkedIn Field */}
            <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-blue-600" /> LinkedIn
                  </FormLabel>
                  <FormControl>
                    <Input className="bg-background" placeholder="https://linkedin.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Leetcode Field */}
            <FormField
              control={form.control}
              name="leetcode"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" /> LeetCode
                  </FormLabel>
                  <FormControl>
                    <Input className="bg-background" placeholder="https://leetcode.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* About Field */}
            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>About Your Experience</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={4}
                      className="resize-none bg-background" 
                      placeholder="Share a brief intro about your journey..." 
                      {...field} 
                    />
                  </FormControl>
                  <div className="flex justify-end">
                    <span className="text-[10px] text-muted-foreground uppercase">
                       {field.value?.length || 0} / 300
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1 gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
            {/* <Button 
              type="button" 
              variant="outline" 
              onClick={() => setEditUser(false)}
              className="flex-1 gap-2"
            >
              <X className="w-4 h-4" /> Cancel
            </Button> */}
          </div>
        </form>
      </Form>
    </div>
  )
}

export default EditUserForm
import React, { useState } from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../ui/input'
import { Github, Linkedin, Trophy, UserCircle, Save } from 'lucide-react'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import * as z from "zod"
import { useEditUserContext } from '../../context/EditContext'
import { useSupabase } from '../../supabase/client'
import { useUser } from '@clerk/clerk-react'
import { toast } from 'react-toastify'
import { Spinner } from '../ui/spinner'

// ---------------- Schema ----------------
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
  about: z.string().max(300, "About must be under 300 characters").optional()
})

// ---------------- Component ----------------
const EditUserForm = ({ userInfo, setIsEditUser }) => {
  const { closeEdit } = useEditUserContext()
  const { user } = useUser()
  const supabase = useSupabase()
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      github: userInfo?.github || "",
      linkedin: userInfo?.linkedin || "",
      leetcode: userInfo?.leetcode || "",
      about: userInfo?.about || ""
    }
  })

  // ---------------- Submit ----------------
  const onSubmit = async (values) => {
    setLoading(true);
    try {
       const { error } = await supabase.from('users').update({
        github: values.github,
        linkedin: values.linkedin,
        leetcode: values.leetcode,
        about: values.about,

    }).eq('clerk_id',userInfo?.clerk_id);

    if (error) {
      console.log("Edit user error: " + error.message)
      return
    }

    toast.success('Profile updated successfully')
    closeEdit();
    setIsEditUser(false);
    } catch (error) {
      console.log(error);
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className=" flex items-center justify-center p-2 sm:p-6">
      <div className="w-full max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 bg-card border rounded-xl shadow-sm">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Set Your Info
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Update your social profiles and bio.
            </p>
          </div>
          <UserCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary/20" />
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

              {/* Github */}
              <FormField
                control={form.control}
                name="github"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm">
                      <Github className="w-4 h-4 text-muted-foreground" />
                      Github
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="w-full h-10 sm:h-11 bg-background"
                        placeholder="https://github.com/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* LinkedIn */}
              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm">
                      <Linkedin className="w-4 h-4 text-blue-600" />
                      LinkedIn
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="w-full h-10 sm:h-11 bg-background"
                        placeholder="https://linkedin.com/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* LeetCode */}
              <FormField
                control={form.control}
                name="leetcode"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="flex items-center gap-2 text-sm">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      LeetCode
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="w-full h-10 sm:h-11 bg-background"
                        placeholder="https://leetcode.com/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* About */}
              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-sm">
                      About Your Experience
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        className="resize-none w-full min-h-[100px] sm:min-h-[120px] bg-background"
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

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                type="submit"
                className="w-full sm:flex-1 gap-2 h-10 sm:h-11"
              >
                <Save className="w-4 h-4" />
                {loading ? <Spinner/> : "Save Changes"}
              </Button>
            </div>

          </form>
        </Form>
      </div>
    </div>
  )
}

export default EditUserForm
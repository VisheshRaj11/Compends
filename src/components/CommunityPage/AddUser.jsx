import React from 'react'
import { useForm } from 'react-hook-form'
import { Form } from '../../components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'

const AddUser = () => {
  const {form} = useForm({
    resolver: zodResolver(),
    defaultValues: {
        email:"",
        name:'',
        
    }
  })
  return (
    <div>
        <Form {...form}>


        </Form>
    </div>
  )
}

export default AddUser
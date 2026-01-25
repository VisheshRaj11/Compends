import { Button } from '@/components/ui/button'
import { SignIn, UserButton } from '@clerk/clerk-react'
import { PlusCircle } from 'lucide-react'
import React from 'react'
import {Outlet } from 'react-router-dom'

const CommunitySection = () => {
  // const navigate = useNavigate();
  return (
    <div className='h-full flex  justify-center items-center'>
        {/* <div className="px-4 mb-6">
          <Button
          onClick={() => navigate('/community/create-community')} 
          className="w-fit gap-2 text-white shadow-lg shadow-indigo-200 py-6 rounded-xl transition-all active:scale-[0.98] ">
            <PlusCircle size={20} />
            <span className="font-medium">Create Community</span>
          </Button>
      </div> */}
       <Outlet />
    </div>
  )
}

export default CommunitySection
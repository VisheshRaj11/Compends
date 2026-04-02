import { Button } from '@/components/ui/button'
import { SignIn, UserButton } from '@clerk/clerk-react'
import { PlusCircle } from 'lucide-react'
import React from 'react'
import { useSelector } from 'react-redux'
import {Outlet } from 'react-router-dom'
import NoCommunity from './NoCommunity'

const CommunitySection = () => {
  // const navigate = useNavigate();
  const currentCommunityId = useSelector((state) => state.currentCommunity.id);
  return (
    <div className='h-full flex  justify-center items-center'>
      {!currentCommunityId ? <NoCommunity/> :  <Outlet />}
    </div>
  )
}

export default CommunitySection
import React from 'react'
import { useSelector } from 'react-redux'
import {Outlet, useLocation } from 'react-router-dom'
import NoCommunity from './NoCommunity'

const CommunitySection = () => {
  // const navigate = useNavigate();
  const currentCommunityId = useSelector((state) => state.currentCommunity.id);
  const location = useLocation();

  const isCreatePage = location.pathname.includes("create-community");
  return (
    <div className='h-full flex  justify-center items-center'>
      {!currentCommunityId  && !isCreatePage ? <NoCommunity/> :  <Outlet />}
    </div>
  )
}

export default CommunitySection
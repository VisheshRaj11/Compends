import React from 'react'
import HeroSection from './HeroSection'
import Features from './Features'
import About from './About'
import LastSection from './LastSection'
import GrowthChart from './GrowthChart'
import Accordian from './Accordian'

const Content = () => {
  return (
    <div className='py-22 px-12'>
        <HeroSection/>
        <Features/>
        <About/>
        <GrowthChart/>
        <LastSection/>
        <Accordian/>
    </div>
  )
}

export default Content
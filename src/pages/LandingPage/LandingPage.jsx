import React from 'react'
import Header from '../../components/LandingPage/Header'
import Content from '../../components/LandingPage/Content'
import Footer from '../../components/LandingPage/Footer'

const LandingPage = () => {
  return (
    <div>
        <Header/>
        <main className='min-h-screen w-full'>
            <Content/>
        </main>
        <Footer/>
    </div>
  )
}

export default LandingPage
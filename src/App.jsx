import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Button } from "./components/ui/button"
import AppLayout from "./Layout/AppLayout"
import LandingPage from "./pages/LandingPage/LandingPage"
import CommunitySection from "./pages/CommunitySection/CommunitySection"
import CommunityForm from "./pages/CommunitySection/CommunityForm"
import Chat from "./components/CommunityPage/Chat"
import Callings from "./components/CommunityPage/calling/Callings"
import Project from "./components/CommunityPage/Project"
import Rank from "./components/CommunityPage/Rank"
import Blog from "./components/CommunityPage/Blog"
import Gallery from "./components/CommunityPage/Gallery"
import ProjectPage from "./components/CommunityPage/ProjectPage"
import Hackathons from "./components/CommunityPage/Hackathons"
import VideoPlayer from "./components/CommunityPage/VideoPlayer"

function App() {
  const router = createBrowserRouter([
    {
      element:<AppLayout/>,
      children:[
        {
          path:'/',
          element:<LandingPage/>
        },
        {
          path:'/community',
          element: <CommunitySection/>,
          children:[{
            path:'create-community',
            element: <CommunityForm/>
          },
          {
            path:'chat/:id',
            element:<Chat/>
          },
          {
            path:'calling/:id',
            element:<Callings/>
          },
          {
            path:'projects/:id',
            element:<Project/>
          },
          {
            path:'projects/page/:communityId/:projectId',
            element:<ProjectPage/>
          },
          {
            path:'ranks/:id',
            element:<Rank/>
          },
          {
            path:'blogs/:id',
            element:<Blog/>
          },
          {
            path:'hackathons/:id',
            element:<Hackathons/>
          },
          {
            path:'videos/:id',
            element:<VideoPlayer/>
          },
        ]
        }
      ]
    }
  ])
  return (
    <RouterProvider router={router}/>
  )
}

export default App
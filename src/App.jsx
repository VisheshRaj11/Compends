import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Button } from "./components/ui/button"
import AppLayout from "./Layout/AppLayout"
import LandingPage from "./pages/LandingPage/LandingPage"
import CommunitySection from "./pages/CommunitySection/CommunitySection"
import CommunityForm from "./pages/CommunitySection/CommunityForm"
import Chat from "./components/CommunityPage/Chat"

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
            path:':id',
            element:<Chat/>
          }
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
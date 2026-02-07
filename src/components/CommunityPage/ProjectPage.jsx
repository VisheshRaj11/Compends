import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

const ProjectPage = () => {
  return (
    <div className="h-screen w-screen border-2 border-black">
			<Tldraw 
        // Handles everything automatically
        inferDarkMode={false}
      />
		</div>
  )
}

export default ProjectPage
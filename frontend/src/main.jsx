import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { EditUserProvider } from './context/EditContext'
import { Provider } from 'react-redux'
import { store } from './store/store'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

createRoot(document.getElementById('root')).render(
    <Provider store={store}>
      <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      >
        <EditUserProvider>
          <App />
        </EditUserProvider>
      </ClerkProvider>
    </Provider>
)

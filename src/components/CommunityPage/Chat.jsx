import React, { useState } from 'react';
import { Button } from '../ui/button';
import { CirclePlus } from 'lucide-react';

const Chat = () => {
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      
      {/* LEFT PART: Sidebar (Hidden on mobile, shown from 'md' breakpoint) */}
      <div className="hidden md:flex md:w-80 lg:w-96 flex-col border-r bg-white">
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Messages</h1>
          <Button className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 cursor-pointer">
            <CirclePlus color='black'/>
            <p className='text-black'>Add User</p>
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* Example Contact Item */}
          <div className="p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-500 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">Alex Johnson</p>
                <p className="text-sm text-gray-500 truncate">Sure, I'll send it over...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PART: Main Chat Area */}
      <div className="flex flex-col flex-1 h-full bg-white">
        {/* Chat Header */}
        <header className="h-16 border-b flex items-center justify-between px-6 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="md:hidden"> {/* Mobile Menu Toggle could go here */} </div>
             <p className="font-bold text-gray-800">Alex Johnson</p>
          </div>
        </header>

        {/* Message Feed */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
           {/* Incoming Message */}
           <div className="flex justify-start">
             <div className="max-w-[70%] bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border">
               How is the project going?
             </div>
           </div>
           
           {/* Outgoing Message */}
           <div className="flex justify-end">
             <div className="max-w-[70%] bg-gray-600 text-white p-3 rounded-2xl rounded-tr-none shadow-md">
               Almost finished! Just fixing the CSS responsiveness now.
             </div>
           </div>
        </main>

        {/* Input Area */}
        <footer className="p-4 border-t bg-white">
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-xl">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 bg-transparent border-none focus:ring-0 px-2"
            />
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
              Send
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Chat;
import { useState, useEffect } from 'react';
import Head from 'next/head';
import ChatBot from '../components/ChatBot';
import BuildDisplay from '../components/BuildDisplay';

export default function Home() {
  const [currentBuild, setCurrentBuild] = useState(null);
  const [activeView, setActiveView] = useState('chat'); // 'chat' or 'build'
  const [isMobile, setIsMobile] = useState(false);

  // Detect if we're on mobile when component mounts
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleBuildDataReceived = (buildData) => {
    console.log('Build received from creator:', buildData);
    setCurrentBuild(buildData);
    // Automatically switch to build view when a new build is created (on mobile)
    if (isMobile) {
      setActiveView('build');
    }
  };

  const toggleView = () => {
    setActiveView(activeView === 'chat' ? 'build' : 'chat');
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-900">
      <Head>
        <title>NBA 2K25 Build Creator</title>
        <meta name="description" content="Create optimized NBA 2K25 player builds for any position and playstyle" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style jsx global>{`
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
          
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          
          @keyframes ping {
            75%, 100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
          
          .animate-ping {
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}</style>
      </Head>

      <main className="h-full flex flex-col">
        {/* Mobile View Toggle - only visible on mobile */}
        <div className="md:hidden flex justify-center py-2 bg-gray-800 border-b border-gray-700">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setActiveView('chat')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                activeView === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveView('build')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                activeView === 'build'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Build View
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 container mx-auto px-4 py-2 flex flex-col md:flex-row gap-6 h-[calc(100%-40px)] md:h-[calc(100%-16px)] overflow-hidden">
          {/* Chat section - full width on mobile when active, 3/5 width on desktop */}
          <div className={`${activeView === 'chat' ? 'block' : 'hidden'} md:block w-full md:w-3/5 h-full overflow-hidden`}>
            <ChatBot onBuildDataReceived={handleBuildDataReceived} />
          </div>
          
          {/* Build display section - full width on mobile when active, 2/5 width on desktop */}
          <div className={`${activeView === 'build' ? 'block' : 'hidden'} md:block w-full md:w-2/5 h-full overflow-hidden`}>
            <BuildDisplay buildData={currentBuild} />
          </div>
        </div>
      </main>
    </div>
  );
}

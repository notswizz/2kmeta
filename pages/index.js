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
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
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
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-5px);
            }
          }
          
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          
          @keyframes pulse-border {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
            }
            50% {
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25);
            }
          }
          
          .animate-pulse-border {
            animation: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
      </Head>

      <main className="h-full flex flex-col">
        {/* Mobile View Toggle - only visible on mobile */}
        <div className="md:hidden flex justify-center py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b border-gray-600 shadow-md">
          <div className="inline-flex rounded-md shadow-lg" role="group">
            <button
              type="button"
              onClick={() => setActiveView('chat')}
              className={`px-5 py-2.5 text-sm font-medium rounded-l-lg transition-all duration-300 ${
                activeView === 'chat'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveView('build')}
              className={`px-5 py-2.5 text-sm font-medium rounded-r-lg transition-all duration-300 ${
                activeView === 'build'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Build View
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 container mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 h-[calc(100%-56px)] md:h-[calc(100%-24px)] overflow-hidden">
          {/* Chat section - full width on mobile when active, 3/5 width on desktop */}
          <div className={`${activeView === 'chat' ? 'block' : 'hidden'} md:block w-full md:w-3/5 h-full overflow-hidden transition-transform duration-300 ease-in-out`}>
            <ChatBot onBuildDataReceived={handleBuildDataReceived} />
          </div>
          
          {/* Build display section - full width on mobile when active, 2/5 width on desktop */}
          <div className={`${activeView === 'build' ? 'block' : 'hidden'} md:block w-full md:w-2/5 h-full overflow-hidden transition-transform duration-300 ease-in-out`}>
            <BuildDisplay buildData={currentBuild} />
          </div>
        </div>
      </main>
    </div>
  );
}

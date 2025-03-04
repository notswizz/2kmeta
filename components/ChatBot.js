import { useState, useEffect, useRef } from 'react';

export default function ChatBot({ onBuildDataReceived }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m an NBA 2K25 Build Creator. I can help you create optimized builds for any playstyle. Just describe what kind of player you want (position, playstyle, attributes, etc.) and I\'ll create the perfect build!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isBuildQuery = (message) => {
    const buildKeywords = [
      'build', 'player', 'create', 'make', 'position', 'height', 'playstyle',
      'shooter', 'slasher', 'playmaker', 'defender', 'center', 'power forward',
      'small forward', 'shooting guard', 'point guard', 'pg', 'sg', 'sf', 'pf', 'c'
    ];
    
    const messageLower = message.toLowerCase();
    return buildKeywords.some(keyword => messageLower.includes(keyword.toLowerCase()));
  };

  // Format formatted height from inches
  const formatHeight = (inches) => {
    if (!inches) return "";
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  };

  // Helper function to format attribute values
  const formatAttributeValue = (value) => {
    if (typeof value !== 'number') return value;
    return Math.round(value);
  };

  const searchForBuild = async (userMessage) => {
    try {
      setLoading(true);
      
      // If this is a build query, search for matching builds
      const response = await fetch('/api/buildCreator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userMessage }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create build');
      }
      
      const data = await response.json();
      console.log('Build creator response:', data);
      
      if (data.build) {
        // Format the build data for display
        let build = data.build;
        let analysis = data.analysis;
                
        // Format the assistant's response
        let assistantResponse = '';
        
        const position = build.position || analysis.position || '';
        const gameMode = analysis.gameMode || 'All game modes';
        const playStyle = analysis.playStyle || build.buildName || '';
        const buildName = build.buildName || '';
        
        // Format height properly
        const formattedHeight = formatHeight(build.height);
        
        // Get top attributes by category
        const getTopAttributes = () => {
          const categories = {
            'Finishing': ['closeShot', 'drivingLayup', 'drivingDunk', 'standingDunk', 'postControl'],
            'Shooting': ['midrange', 'threePoint', 'freeThrow'],
            'Playmaking': ['passAccuracy', 'ballHandle', 'speedWithBall'],
            'Defense': ['interiorDefense', 'perimeterDefense', 'steal', 'block', 'offensiveRebound', 'defensiveRebound'],
            'Physicals': ['speed', 'acceleration', 'strength', 'vertical', 'stamina']
          };
          
          const attributes = {};
          
          for (const [category, attrs] of Object.entries(categories)) {
            let categoryAttrs = {};
            for (const attr of attrs) {
              if (build[attr] !== undefined) {
                const displayName = attr
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase());
                categoryAttrs[displayName] = formatAttributeValue(build[attr]);
              }
            }
            
            if (Object.keys(categoryAttrs).length > 0) {
              attributes[category] = categoryAttrs;
            }
          }
          
          return attributes;
        };
        
        const topAttributes = getTopAttributes();
        
        // Compile the assistant's response
        assistantResponse = `# ${buildName || playStyle} Build Created!

**Position:** ${position}
**Height:** ${formattedHeight}
**Weight:** ${build.weight} lbs
**Wingspan:** ${build.wingspan} inches

## Key Attributes:
${Object.entries(topAttributes)
  .map(([category, attrs]) => 
    `**${category}:** ${Object.entries(attrs)
      .map(([name, value]) => `${name}: ${value}`)
      .slice(0, 3)  // Show top 3 attributes per category
      .join(', ')}`)
  .join('\n')}

This build is optimized for ${playStyle.toLowerCase()} playstyle. Check the sidebar for detailed attribute caps and stats!`;

        // Create a flattened version of the build data for the sidebar
        const flattenedBuild = {
          position: build.position,
          height: build.height,
          weight: build.weight,
          wingspan: build.wingspan,
          overall: build.overall,
          buildName: buildName || playStyle,
          specialBadges: {
            tier1: build.tier1MaxPlusOne,
            tier2: build.tier2MaxPlusOne
          },
          badges: build.badges || {},
          ...build // Include all the individual attributes
        };
        
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: assistantResponse }
        ]);
        
        if (onBuildDataReceived) {
          onBuildDataReceived(flattenedBuild);
        }
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: "I couldn't create a build based on your request. Could you provide more details about the type of player you want to create? For example, position, playstyle, or key attributes you want to focus on." }
        ]);
      }
    } catch (error) {
      console.error('Error searching for build:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Sorry, I encountered an error while creating your build. Please try again with more specific details about the build you want." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Add user message to the chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // If this is a build query, search for matching builds
    if (isBuildQuery(userMessage)) {
      await searchForBuild(userMessage);
    } else {
      // If not a build query, provide a generic response
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "I'm an NBA 2K25 Build Creator and can help you create optimized builds. Try asking me to create a build for a specific position or playstyle!" }
      ]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden animate-pulse-border">
      {/* Chat Header */}
      <div className="px-4 py-4 border-b border-gray-700/70 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-t-lg shadow-md">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full inline-block mr-2 animate-pulse"></span>
          NBA 2K25 Build Creator
        </h3>
      </div>
      
      {/* Chat messages container */}
      <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-gray-800">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl p-3 sm:p-4 ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white' 
                    : 'bg-gradient-to-br from-gray-700 via-gray-750 to-gray-800 text-gray-100 border border-gray-600/50'
                } shadow-md transform transition-transform duration-300 hover:scale-[1.01]`}
              >
                {message.content.includes('#') || message.content.includes('**') ? (
                  <div className="prose prose-invert max-w-none">
                    {message.content.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={i} className="text-xl font-bold mt-0 mb-2 text-blue-300">{line.replace('# ', '')}</h1>;
                      } else if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-lg font-bold mt-3 mb-2 text-blue-300">{line.replace('## ', '')}</h2>;
                      } else if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-semibold my-1">{line.replace(/\*\*/g, '')}</p>;
                      } else if (line.startsWith('**')) {
                        const parts = line.split('**');
                        return (
                          <p key={i} className="my-1">
                            <span className="font-semibold">{parts[1]}</span> 
                            {parts[2]}
                          </p>
                        );
                      } else {
                        return <p key={i} className="my-1">{line}</p>;
                      }
                    })}
                  </div>
                ) : (
                  <div>{message.content}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700/50">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={loading ? "Generating response..." : "Describe your ideal player build..."}
            className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-l-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600/70 pl-10 shadow-inner"
            disabled={loading}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <span className={`w-4 h-4 bg-blue-500 rounded-full inline-block ${loading ? 'animate-pulse' : 'animate-float'}`}></span>
          </div>
          <button
            type="submit"
            className={`bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 sm:px-6 py-3 rounded-r-xl font-medium text-sm sm:text-base relative overflow-hidden shadow-lg ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-800 hover:shadow-blue-700/20 transition-all duration-300'}`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="h-2 w-2 bg-blue-300 rounded-full animate-ping mr-1"></span>
                <span className="h-2 w-2 bg-blue-300 rounded-full animate-ping delay-75 mr-1"></span>
                <span className="h-2 w-2 bg-blue-300 rounded-full animate-ping delay-150"></span>
              </span>
            ) : (
              'Send'
            )}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-blue-400/10 to-transparent -translate-x-full animate-shimmer"></div>
          </button>
        </div>
      </form>
    </div>
  );
} 
import { useState } from 'react';

export default function BuildDisplay({ buildData }) {
  const [showAllAttributes, setShowAllAttributes] = useState(true);

  // Format height from inches to feet and inches
  const formatHeight = (inches) => {
    if (!inches) return null;
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  };

  // Format wingspan from inches to feet and inches
  const formatWingspan = (inches) => {
    if (!inches) return null;
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  };

  // Render attribute bar with appropriate color based on value
  const renderAttributeBar = (name, value) => {
    const percent = Math.min(100, Math.max(0, (value / 99) * 100));
    
    let barColor = 'bg-red-500';
    if (value >= 90) barColor = 'bg-gradient-to-r from-green-500 to-green-600';
    else if (value >= 80) barColor = 'bg-gradient-to-r from-green-400 to-green-500';
    else if (value >= 70) barColor = 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    else if (value >= 60) barColor = 'bg-gradient-to-r from-yellow-500 to-orange-400';
    else if (value >= 50) barColor = 'bg-gradient-to-r from-orange-400 to-orange-500';
    else barColor = 'bg-gradient-to-r from-red-500 to-red-600';
    
    return (
      <div key={name} className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs sm:text-sm text-gray-300">{name}</span>
          <span className="text-xs sm:text-sm font-bold text-white">{value}</span>
        </div>
        <div className="h-1.5 sm:h-2 w-full bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div 
            className={`h-full ${barColor}`} 
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  };

  // Determine player archetypes based on attributes
  const determineArchetypes = () => {
    if (!buildData) return [];
    
    const archetypes = [];
    const { 
      threePoint, drivingDunk, perimeterDefense, steal, 
      passAccuracy, ballHandle, interiorDefense, block, 
      defensiveRebound, offensiveRebound, position
    } = buildData;
    
    if (threePoint >= 85) archetypes.push('Shooter');
    if (drivingDunk >= 85) archetypes.push('Slasher');
    if ((perimeterDefense >= 85 || interiorDefense >= 85) && (steal >= 80 || block >= 80)) 
      archetypes.push('Defender');
    if (passAccuracy >= 85 && ballHandle >= 85) archetypes.push('Playmaker');
    if (position === 'Center' || position === 'Power Forward') {
      if (defensiveRebound >= 85 && offensiveRebound >= 80) archetypes.push('Rebounder');
      if (block >= 85 && interiorDefense >= 85) archetypes.push('Rim Protector');
    }
    
    return archetypes.length > 0 ? archetypes : ['All-Around'];
  };

  // Generate a description of the build's playstyle based on attributes and name
  const generateBuildDescription = () => {
    if (!buildData) return '';
    
    const buildName = buildData.buildName || '';
    const position = buildData.position || '';
    const archetypes = determineArchetypes();
    
    // Common build name descriptions
    const buildDescriptions = {
      '3-Level Scorer': 'This build excels at scoring from all three levels - inside, mid-range, and three-point range.',
      'Glass-Cleaning Finisher': 'A dominant interior presence that can finish at the rim and control the boards.',
      'Paint Beast': 'Dominates in the paint with strong finishing and interior defense.',
      'Playmaking Shot Creator': 'Handles the ball well and creates shots for themselves and others.',
      '2-Way Slashing Playmaker': 'Elite at driving to the basket while also locking down opponents on defense.',
      'Sharpshooter': 'Specializes in long-range shooting with deadly accuracy.',
      'Lockdown Defender': 'Focused on shutting down opposing players with strong defensive attributes.',
      'Slasher': 'Excels at attacking the rim and finishing through contact.',
      'Glass Cleaner': 'Specializes in rebounding and second-chance opportunities.',
      'Post Scorer': 'Dominates in the post with a variety of back-to-the-basket moves.',
      '3&D Wing': 'Specializes in three-point shooting and perimeter defense.',
      'Offensive Threat': 'A versatile offensive player who can score in multiple ways.',
      'Inside-Out Scorer': 'Can score effectively both in the paint and from the perimeter.',
      'Defensive Anchor': 'The backbone of the defense, protecting the rim and controlling the paint.',
      'Playmaker': 'Specializes in ball handling and passing to create opportunities for teammates.'
    };
    
    // Check if we have a direct match for the build name
    if (buildName && buildDescriptions[buildName]) {
      return buildDescriptions[buildName];
    }
    
    // Otherwise, generate based on position and archetypes
    let description = `This ${position} build `;
    
    if (archetypes.includes('Shooter') && archetypes.includes('Defender')) {
      description += 'balances perimeter shooting with strong defensive capabilities.';
    } else if (archetypes.includes('Shooter') && archetypes.includes('Playmaker')) {
      description += 'combines shooting accuracy with playmaking ability to create opportunities.';
    } else if (archetypes.includes('Slasher') && archetypes.includes('Defender')) {
      description += 'excels at attacking the rim while providing solid defensive presence.';
    } else if (archetypes.includes('Shooter')) {
      description += 'specializes in perimeter shooting and spacing the floor.';
    } else if (archetypes.includes('Slasher')) {
      description += 'focuses on attacking the basket and finishing at the rim.';
    } else if (archetypes.includes('Defender')) {
      description += 'prioritizes defensive attributes to lock down opponents.';
    } else if (archetypes.includes('Playmaker')) {
      description += 'focuses on ball handling and court vision to create for teammates.';
    } else if (archetypes.includes('Rim Protector')) {
      description += 'protects the paint and alters shots around the basket.';
    } else {
      description += 'provides a balanced approach with versatility across multiple skills.';
    }
    
    return description;
  };

  // Organize attributes by category
  const attributeCategories = {
    Finishing: ['closeShot', 'drivingLayup', 'drivingDunk', 'standingDunk', 'postControl'],
    Shooting: ['midrange', 'threePoint', 'freeThrow'],
    Playmaking: ['passAccuracy', 'ballHandle', 'speedWithBall'],
    Defense: ['interiorDefense', 'perimeterDefense', 'steal', 'block'],
    Rebounding: ['offensiveRebound', 'defensiveRebound'],
    Physical: ['speed', 'acceleration', 'strength', 'vertical', 'stamina']
  };

  // Format attribute name for display
  const formatAttributeName = (key) => {
    // Special cases
    const specialCases = {
      midrange: 'Mid-Range Shot',
      threePoint: 'Three-Point Shot',
    };
    
    if (specialCases[key]) return specialCases[key];
    
    // Default formatting: camelCase to Title Case with spaces
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  // Format attribute value for display
  const formatAttributeValue = (value) => {
    if (typeof value !== 'number') return value;
    return Math.round(value);
  };

  if (!buildData) {
    return (
      <div className="h-full flex flex-col overflow-y-auto p-4 sm:p-5 space-y-5 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg animate-pulse-border">
        {!buildData ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 animate-float flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-blue-300 mb-2">No Build Created Yet</h3>
            <p className="text-gray-400 text-center max-w-sm">
              Use the chat to describe your ideal player and I'll create an optimized build for you.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Build Header with Name and Position */}
            <div className="bg-gradient-to-r from-blue-900/70 to-indigo-900/70 rounded-2xl p-4 sm:p-5 shadow-lg border border-blue-800/40 transform transition-transform duration-300 hover:scale-[1.01]">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white">{buildData.buildName || "Custom Build"}</h2>
                <div className="px-3 py-1 bg-blue-700/70 text-white text-sm font-semibold rounded-full border border-blue-600/40 shadow">
                  {buildData.position || "Position"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-1">
                {determineArchetypes().map(archetype => (
                  <span 
                    key={archetype}
                    className="px-2.5 py-1 bg-gradient-to-r from-indigo-700/70 to-indigo-900/70 rounded-lg text-xs text-white border border-indigo-600/40 shadow"
                  >
                    {archetype}
                  </span>
                ))}
              </div>
              
              <div className="mt-3 text-gray-300 text-sm">
                {generateBuildDescription()}
              </div>
            </div>
          
            {/* Physical Stats */}
            <div className="bg-gradient-to-br from-gray-700/70 to-gray-800/70 rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-600/40 transform transition-transform duration-300 hover:scale-[1.01]">
              <h3 className="text-base sm:text-lg font-semibold text-blue-300 mb-3">Physical Profile</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center bg-gray-800/80 rounded-xl p-3 border border-gray-700/50">
                  <span className="text-xs text-gray-400 mb-1">Height</span>
                  <span className="text-lg font-semibold text-white">{formatHeight(buildData.height)}</span>
                </div>
                <div className="flex flex-col items-center bg-gray-800/80 rounded-xl p-3 border border-gray-700/50">
                  <span className="text-xs text-gray-400 mb-1">Weight</span>
                  <span className="text-lg font-semibold text-white">{buildData.weight} lbs</span>
                </div>
                <div className="flex flex-col items-center bg-gray-800/80 rounded-xl p-3 border border-gray-700/50">
                  <span className="text-xs text-gray-400 mb-1">Wingspan</span>
                  <span className="text-lg font-semibold text-white">{formatWingspan(buildData.wingspan)}</span>
                </div>
              </div>
            </div>
            
            {/* Badges Section */}
            <div className="bg-gradient-to-br from-gray-700/70 to-gray-800/70 rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-600/40 transform transition-transform duration-300 hover:scale-[1.01]">
              <h3 className="text-base sm:text-lg font-semibold text-blue-300 mb-3">Badges</h3>
              <div className="space-y-4">
                {(() => {
                  // Create a categorized structure for badges
                  const badgeCategories = {
                    'Finishing': [],
                    'Shooting': [],
                    'Playmaking': [],
                    'Defense': [],
                    'Other': []
                  };
                  
                  // Process badges into categories
                  Object.entries(buildData.badges || {}).forEach(([badgeName, badgeData]) => {
                    // Check if it's a complex object with category or just a level string
                    let category = 'Other';
                    let level = 1;
                    
                    if (typeof badgeData === 'object' && badgeData !== null) {
                      // Handle object format (from API)
                      if (badgeData.category) {
                        const cat = badgeData.category.charAt(0).toUpperCase() + badgeData.category.slice(1);
                        if (badgeCategories[cat] !== undefined) {
                          category = cat;
                        } else if (cat === 'Inside Scoring') {
                          category = 'Finishing';
                        } else if (cat === 'Outside Scoring') {
                          category = 'Shooting';
                        }
                      }
                      
                      // Get the level
                      if (badgeData.level) {
                        if (typeof badgeData.level === 'string') {
                          // Convert string level to number
                          switch (badgeData.level) {
                            case 'Hall of Fame': level = 4; break;
                            case 'Gold': level = 3; break;
                            case 'Silver': level = 2; break;
                            case 'Bronze': level = 1; break;
                            default: level = 1;
                          }
                        } else {
                          level = badgeData.level;
                        }
                      }
                    } else if (typeof badgeData === 'string') {
                      // Handle string format
                      switch (badgeData) {
                        case 'Hall of Fame': level = 4; break;
                        case 'Gold': level = 3; break;
                        case 'Silver': level = 2; break;
                        case 'Bronze': level = 1; break;
                        default: level = 1;
                      }
                    } else if (typeof badgeData === 'number') {
                      // Direct number
                      level = badgeData;
                    }
                    
                    // Add to the appropriate category
                    badgeCategories[category].push({
                      name: badgeName,
                      level: level
                    });
                  });
                  
                  // Sort badges by level within each category
                  Object.keys(badgeCategories).forEach(category => {
                    badgeCategories[category].sort((a, b) => b.level - a.level);
                  });
                  
                  // Render categories that have badges
                  return Object.entries(badgeCategories)
                    .filter(([_, badges]) => badges.length > 0)
                    .map(([category, categoryBadges]) => (
                      <div key={category} className="bg-gray-800/80 rounded-xl border border-gray-700/50 p-3 sm:p-4">
                        <h4 className="text-sm sm:text-base font-medium text-blue-300 mb-2">{category}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {categoryBadges.map(badge => {
                            // Badge level colors
                            const levelColors = {
                              1: "bg-gradient-to-r from-amber-800 to-amber-700 border-amber-700/70", // Bronze
                              2: "bg-gradient-to-r from-slate-400 to-slate-500 border-slate-300/70", // Silver
                              3: "bg-gradient-to-r from-yellow-500 to-yellow-600 border-yellow-400/70", // Gold
                              4: "bg-gradient-to-r from-purple-600 to-purple-700 border-purple-500/70" // HoF (purple)
                            };
                            
                            const levelNames = {
                              1: "Bronze",
                              2: "Silver",
                              3: "Gold",
                              4: "HoF"
                            };
                            
                            const colorClass = levelColors[badge.level] || "bg-gradient-to-r from-gray-600 to-gray-700 border-gray-500/70";
                            
                            return (
                              <div 
                                key={badge.name} 
                                className={`${colorClass} text-white text-xs rounded-lg px-2 py-1.5 border flex items-center justify-between shadow-md transform transition-transform duration-200 hover:scale-[1.02]`}
                              >
                                <span className="truncate">{badge.name}</span>
                                <span className="ml-1 text-xs font-bold opacity-90">{levelNames[badge.level] || badge.level}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                })()}
              </div>
            </div>
        
            {/* Attributes Section with Mobile Optimization */}
            <div className="bg-gradient-to-br from-gray-700/70 to-gray-800/70 rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-600/40 transform transition-transform duration-300 hover:scale-[1.01]">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-blue-300">Attributes</h3>
                <button 
                  onClick={() => setShowAllAttributes(!showAllAttributes)}
                  className="text-xs sm:text-sm bg-blue-800/60 hover:bg-blue-700/70 text-blue-300 border border-blue-700/40 rounded-lg px-3 py-1.5 transition-colors duration-200"
                >
                  {showAllAttributes ? 'Show Top Only' : 'Show All'}
                </button>
              </div>
              
              <div className="space-y-4 sm:space-y-5">
                {Object.entries(attributeCategories).map(([category, attributes]) => {
                  // Filter attributes that exist in buildData
                  const categoryAttributes = attributes
                    .filter(attr => buildData[attr] !== undefined)
                    .sort((a, b) => buildData[b] - buildData[a]);
                  
                  // Skip category if no attributes exist
                  if (categoryAttributes.length === 0) return null;
                  
                  // For non-full view, show only top 3 attributes per category
                  const attrsToShow = showAllAttributes 
                    ? categoryAttributes 
                    : categoryAttributes.slice(0, 3);
                  
                  return (
                    <div key={category} className="bg-gray-800/80 rounded-xl border border-gray-700/50 p-3 sm:p-4">
                      <h4 className="text-sm sm:text-base font-medium text-blue-300 mb-3">{category}</h4>
                      <div className="space-y-3">
                        {attrsToShow.map(attr => 
                          renderAttributeBar(formatAttributeName(attr), formatAttributeValue(buildData[attr]))
                        )}
                        {!showAllAttributes && categoryAttributes.length > 3 && (
                          <div className="text-xs text-gray-400 text-right mt-2">
                            +{categoryAttributes.length - 3} more attributes
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Extract badges if they exist
  const badges = buildData.badges || {};
  const buildDescription = generateBuildDescription();
  
  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 sm:p-5 space-y-5 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-lg animate-pulse-border">
      {!buildData ? (
        // Empty state
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 animate-float flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-blue-300 mb-2">No Build Created Yet</h3>
          <p className="text-gray-400 text-center max-w-sm">
            Use the chat to describe your ideal player and I'll create an optimized build for you.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Build Header with Name and Position */}
          <div className="bg-gradient-to-r from-blue-900/70 to-indigo-900/70 rounded-2xl p-4 sm:p-5 shadow-lg border border-blue-800/40 transform transition-transform duration-300 hover:scale-[1.01]">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{buildData.buildName || "Custom Build"}</h2>
              <div className="px-3 py-1 bg-blue-700/70 text-white text-sm font-semibold rounded-full border border-blue-600/40 shadow">
                {buildData.position || "Position"}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-1">
              {determineArchetypes().map(archetype => (
                <span 
                  key={archetype}
                  className="px-2.5 py-1 bg-gradient-to-r from-indigo-700/70 to-indigo-900/70 rounded-lg text-xs text-white border border-indigo-600/40 shadow"
                >
                  {archetype}
                </span>
              ))}
            </div>
            
            <div className="mt-3 text-gray-300 text-sm">
              {generateBuildDescription()}
            </div>
          </div>
        
          {/* Physical Stats */}
          <div className="bg-gradient-to-br from-gray-700/70 to-gray-800/70 rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-600/40 transform transition-transform duration-300 hover:scale-[1.01]">
            <h3 className="text-base sm:text-lg font-semibold text-blue-300 mb-3">Physical Profile</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center bg-gray-800/80 rounded-xl p-3 border border-gray-700/50">
                <span className="text-xs text-gray-400 mb-1">Height</span>
                <span className="text-lg font-semibold text-white">{formatHeight(buildData.height)}</span>
              </div>
              <div className="flex flex-col items-center bg-gray-800/80 rounded-xl p-3 border border-gray-700/50">
                <span className="text-xs text-gray-400 mb-1">Weight</span>
                <span className="text-lg font-semibold text-white">{buildData.weight} lbs</span>
              </div>
              <div className="flex flex-col items-center bg-gray-800/80 rounded-xl p-3 border border-gray-700/50">
                <span className="text-xs text-gray-400 mb-1">Wingspan</span>
                <span className="text-lg font-semibold text-white">{formatWingspan(buildData.wingspan)}</span>
              </div>
            </div>
          </div>
          
          {/* Badges Section */}
          <div className="bg-gradient-to-br from-gray-700/70 to-gray-800/70 rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-600/40 transform transition-transform duration-300 hover:scale-[1.01]">
            <h3 className="text-base sm:text-lg font-semibold text-blue-300 mb-3">Badges</h3>
            <div className="space-y-4">
              {(() => {
                // Create a categorized structure for badges
                const badgeCategories = {
                  'Finishing': [],
                  'Shooting': [],
                  'Playmaking': [],
                  'Defense': [],
                  'Other': []
                };
                
                // Process badges into categories
                Object.entries(badges).forEach(([badgeName, badgeData]) => {
                  // Check if it's a complex object with category or just a level string
                  let category = 'Other';
                  let level = 1;
                  
                  if (typeof badgeData === 'object' && badgeData !== null) {
                    // Handle object format (from API)
                    if (badgeData.category) {
                      const cat = badgeData.category.charAt(0).toUpperCase() + badgeData.category.slice(1);
                      if (badgeCategories[cat] !== undefined) {
                        category = cat;
                      } else if (cat === 'Inside Scoring') {
                        category = 'Finishing';
                      } else if (cat === 'Outside Scoring') {
                        category = 'Shooting';
                      }
                    }
                    
                    // Get the level
                    if (badgeData.level) {
                      if (typeof badgeData.level === 'string') {
                        // Convert string level to number
                        switch (badgeData.level) {
                          case 'Hall of Fame': level = 4; break;
                          case 'Gold': level = 3; break;
                          case 'Silver': level = 2; break;
                          case 'Bronze': level = 1; break;
                          default: level = 1;
                        }
                      } else {
                        level = badgeData.level;
                      }
                    }
                  } else if (typeof badgeData === 'string') {
                    // Handle string format
                    switch (badgeData) {
                      case 'Hall of Fame': level = 4; break;
                      case 'Gold': level = 3; break;
                      case 'Silver': level = 2; break;
                      case 'Bronze': level = 1; break;
                      default: level = 1;
                    }
                  } else if (typeof badgeData === 'number') {
                    // Direct number
                    level = badgeData;
                  }
                  
                  // Add to the appropriate category
                  badgeCategories[category].push({
                    name: badgeName,
                    level: level
                  });
                });
                
                // Sort badges by level within each category
                Object.keys(badgeCategories).forEach(category => {
                  badgeCategories[category].sort((a, b) => b.level - a.level);
                });
                
                // Render categories that have badges
                return Object.entries(badgeCategories)
                  .filter(([_, badges]) => badges.length > 0)
                  .map(([category, categoryBadges]) => (
                    <div key={category} className="bg-gray-800/80 rounded-xl border border-gray-700/50 p-3 sm:p-4">
                      <h4 className="text-sm sm:text-base font-medium text-blue-300 mb-2">{category}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categoryBadges.map(badge => {
                          // Badge level colors
                          const levelColors = {
                            1: "bg-gradient-to-r from-amber-800 to-amber-700 border-amber-700/70", // Bronze
                            2: "bg-gradient-to-r from-slate-400 to-slate-500 border-slate-300/70", // Silver
                            3: "bg-gradient-to-r from-yellow-500 to-yellow-600 border-yellow-400/70", // Gold
                            4: "bg-gradient-to-r from-purple-600 to-purple-700 border-purple-500/70" // HoF (purple)
                          };
                          
                          const levelNames = {
                            1: "Bronze",
                            2: "Silver",
                            3: "Gold",
                            4: "HoF"
                          };
                          
                          const colorClass = levelColors[badge.level] || "bg-gradient-to-r from-gray-600 to-gray-700 border-gray-500/70";
                          
                          return (
                            <div 
                              key={badge.name} 
                              className={`${colorClass} text-white text-xs rounded-lg px-2 py-1.5 border flex items-center justify-between shadow-md transform transition-transform duration-200 hover:scale-[1.02]`}
                            >
                              <span className="truncate">{badge.name}</span>
                              <span className="ml-1 text-xs font-bold opacity-90">{levelNames[badge.level] || badge.level}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
              })()}
            </div>
          </div>
      
          {/* Attributes Section with Mobile Optimization */}
          <div className="bg-gradient-to-br from-gray-700/70 to-gray-800/70 rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-600/40 transform transition-transform duration-300 hover:scale-[1.01]">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-blue-300">Attributes</h3>
              <button 
                onClick={() => setShowAllAttributes(!showAllAttributes)}
                className="text-xs sm:text-sm bg-blue-800/60 hover:bg-blue-700/70 text-blue-300 border border-blue-700/40 rounded-lg px-3 py-1.5 transition-colors duration-200"
              >
                {showAllAttributes ? 'Show Top Only' : 'Show All'}
              </button>
            </div>
            
            <div className="space-y-4 sm:space-y-5">
              {Object.entries(attributeCategories).map(([category, attributes]) => {
                // Filter attributes that exist in buildData
                const categoryAttributes = attributes
                  .filter(attr => buildData[attr] !== undefined)
                  .sort((a, b) => buildData[b] - buildData[a]);
                
                // Skip category if no attributes exist
                if (categoryAttributes.length === 0) return null;
                
                // For non-full view, show only top 3 attributes per category
                const attrsToShow = showAllAttributes 
                  ? categoryAttributes 
                  : categoryAttributes.slice(0, 3);
                
                return (
                  <div key={category} className="bg-gray-800/80 rounded-xl border border-gray-700/50 p-3 sm:p-4">
                    <h4 className="text-sm sm:text-base font-medium text-blue-300 mb-3">{category}</h4>
                    <div className="space-y-3">
                      {attrsToShow.map(attr => 
                        renderAttributeBar(formatAttributeName(attr), formatAttributeValue(buildData[attr]))
                      )}
                      {!showAllAttributes && categoryAttributes.length > 3 && (
                        <div className="text-xs text-gray-400 text-right mt-2">
                          +{categoryAttributes.length - 3} more attributes
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
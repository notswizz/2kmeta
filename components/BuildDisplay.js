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
      <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-800 text-white border border-gray-700 rounded-lg shadow-xl">
        <div className="text-center mb-6">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-blue-300">No Build Selected</h3>
          <p className="text-sm sm:text-base text-gray-300">
            Ask the chatbot to create a player build for you. Try prompts like:
          </p>
          <p className="mt-3 text-sm sm:text-base text-blue-400 italic">
            "Create a shooting guard build with good defense"
          </p>
          <p className="mt-2 text-sm sm:text-base text-blue-400 italic">
            "Make me a point guard that can shoot and dunk"
          </p>
          <p className="mt-2 text-sm sm:text-base text-blue-400 italic">
            "What's a good build for a 7-foot center?"
          </p>
        </div>
      </div>
    );
  }

  // Extract badges if they exist
  const badges = buildData.badges || {};
  const buildDescription = generateBuildDescription();
  
  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4 bg-gray-800 text-white border border-gray-700 rounded-lg shadow-xl">
      {/* Build header with name and attributes */}
      <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-700">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300">
              {buildData.buildName || 'Custom Build'}
            </h2>
            <div className="flex flex-wrap items-center mt-1 text-sm sm:text-base">
              <span className="text-blue-400 font-medium mr-2">{buildData.position}</span>
              <span className="text-gray-500 mr-1">|</span>
              <span className="mr-2 text-gray-300">{formatHeight(buildData.height)}</span>
              <span className="text-gray-500 mr-1">|</span>
              <span className="mr-2 text-gray-300">{buildData.weight} lbs</span>
              <span className="text-gray-500 mr-1">|</span>
              <span className="mr-2 text-gray-300">{formatWingspan(buildData.wingspan)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap mt-2 sm:mt-3">
          {determineArchetypes().map(archetype => (
            <span key={archetype} className="text-xs mr-2 mb-1 px-2 py-1 bg-blue-900/40 rounded-full text-blue-300 border border-blue-800">
              {archetype}
            </span>
          ))}
        </div>
        
        {/* Build Description */}
        {buildDescription && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-900/20 border border-blue-800/50 rounded-md text-xs sm:text-sm text-blue-200">
            {buildDescription}
          </div>
        )}
      </div>

      {/* Badge Section with Mobile Optimization - Show ALL badges */}
      {Object.keys(badges).length > 0 && (
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-blue-300">Badges</h3>
          </div>
          
          <div className="space-y-3">
            {/* Process all badges */}
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
                  <div key={category} className="bg-gray-700/50 rounded-lg border border-gray-600/50 p-2 sm:p-3">
                    <h4 className="text-sm sm:text-base font-medium text-blue-300 mb-2">{category}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categoryBadges.map(badge => {
                        // Badge level colors
                        const levelColors = {
                          1: "bg-gray-500 border-gray-400",
                          2: "bg-blue-600 border-blue-500",
                          3: "bg-purple-600 border-purple-500",
                          4: "bg-yellow-500 border-yellow-400"
                        };
                        
                        const levelNames = {
                          1: "Bronze",
                          2: "Silver",
                          3: "Gold",
                          4: "HoF"
                        };
                        
                        const colorClass = levelColors[badge.level] || "bg-gray-600 border-gray-500";
                        
                        return (
                          <div 
                            key={badge.name} 
                            className={`${colorClass} text-white text-xs rounded px-2 py-1 border flex items-center justify-between`}
                          >
                            <span className="truncate">{badge.name}</span>
                            <span className="ml-1 text-xs font-bold">{levelNames[badge.level] || badge.level}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
            })()}
          </div>
        </div>
      )}
      
      {/* Attributes Section with Mobile Optimization */}
      <div>
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-blue-300">Attributes</h3>
          <button 
            onClick={() => setShowAllAttributes(!showAllAttributes)}
            className="text-xs sm:text-sm bg-blue-900/50 hover:bg-blue-800/60 text-blue-300 border border-blue-800/30 rounded px-2 py-1"
          >
            {showAllAttributes ? 'Show Top Only' : 'Show All'}
          </button>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
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
              <div key={category} className="bg-gray-700/50 rounded-lg border border-gray-600/50 p-2 sm:p-3">
                <h4 className="text-sm sm:text-base font-medium text-blue-300 mb-2">{category}</h4>
                <div className="space-y-2">
                  {attrsToShow.map(attr => 
                    renderAttributeBar(formatAttributeName(attr), formatAttributeValue(buildData[attr]))
                  )}
                  {!showAllAttributes && categoryAttributes.length > 3 && (
                    <div className="text-xs text-gray-400 text-right mt-1">
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
  );
} 
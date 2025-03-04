const { heightToInches, ATTRIBUTE_NAME_MAPPING, ATTRIBUTE_REVERSE_MAPPING } = require('./utils');

// Helper function to calculate top badges
function calculateTopBadges(build, badgeRequirements, badgeMaxLevelByHeight) {
  // Initialize badge structure
  const topBadges = {
    badges: {},
    hof: "",
    gold: ""
  };
  
  // Log badge data for debugging
  console.log(`Processing ${badgeRequirements?.length || 0} badge requirements`);
  
  // Check for valid badge requirements data
  if (!badgeRequirements || !Array.isArray(badgeRequirements)) {
    console.warn('Invalid badge requirements data, using empty array');
    return topBadges;
  }
  
  // Get player height in the format used by NBA2KLab (e.g., "six_four" for 6'4")
  const heightInInches = build.height || 80; // Default to 6'8" if not specified
  const feet = Math.floor(heightInInches / 12);
  const inches = heightInInches % 12;
  
  // Convert to the format used in NBA2KLab data (e.g., "six_four" for 6'4")
  const heightWords = [
    "", "one", "two", "three", "four", "five", 
    "six", "seven", "eight", "nine", "ten", "eleven"
  ];
  
  const heightKey = inches === 0 
    ? `${heightWords[feet]}` 
    : `${heightWords[feet]}_${heightWords[inches]}`;
  
  console.log(`Player height: ${feet}'${inches}" (${heightKey})`);
  
  // Get badge max levels by height lookup
  const badgeMaxLevels = {};
  
  if (badgeMaxLevelByHeight && badgeMaxLevelByHeight.pageProps && 
     Array.isArray(badgeMaxLevelByHeight.pageProps.badgeTiers)) {
    
    badgeMaxLevelByHeight.pageProps.badgeTiers.forEach(badgeTier => {
      // Get max level for this badge at the player's height
      if (badgeTier.badge && badgeTier[heightKey]) {
        const maxLevel = badgeTier[heightKey];
        badgeMaxLevels[badgeTier.badge] = maxLevel;
      }
    });
  }
  
  // Map level strings to numeric values
  const badgeLevelValues = {
    "Legend": 5,
    "HoF": 4,
    "Gold": 3,
    "Silver": 2,
    "Bronze": 1,
    "": 0
  };
  
  // Map build attributes to badge requirements
  const badgeLevels = {};
  
  badgeRequirements.forEach(badge => {
    if (!badge || !badge.Attribute || !badge.Badge) return;
    
    // Skip badges that aren't available at the player's height
    if (badge.Min_Height && badge.Max_Height) {
      const minHeightInches = heightToInches(badge.Min_Height);
      const maxHeightInches = heightToInches(badge.Max_Height);
      
      if (heightInInches < minHeightInches || heightInInches > maxHeightInches) {
        // Badge not available at this height
        return;
      }
    }
    
    // Standard attribute name handling
    const attributeNormalized = badge.Attribute.toLowerCase().replace(/[\s-_]+/g, '');
    
    // Find the matching internal attribute name
    let buildAttribute = null;
    for (const [ourName, apiNames] of Object.entries(ATTRIBUTE_NAME_MAPPING)) {
      const normalizedApiNames = apiNames.map(name => name.toLowerCase().replace(/[\s-_]+/g, ''));
      if (normalizedApiNames.includes(attributeNormalized)) {
        buildAttribute = ourName;
        break;
      }
    }
    
    // If we couldn't map it, try direct matching
    if (!buildAttribute) {
      buildAttribute = ATTRIBUTE_REVERSE_MAPPING[attributeNormalized] || attributeNormalized;
    }
    
    // Handle special cases for badge-specific attribute mappings
    switch (attributeNormalized) {
      case 'midrange':
      case 'midrangeshot':
      case 'midrange-shot':
      case 'mid-rangeshot':
        buildAttribute = 'midrange';
        break;
      case 'layup':
      case 'drivinglayup':
        buildAttribute = 'drivingLayup';
        break;
      case 'threepointshot':
      case 'threepointshoot':
      case 'three-pointer':
      case 'three-point':
        buildAttribute = 'threePoint';
        break;
      case 'acceleration':
      case 'agility':
        buildAttribute = 'acceleration';
        break;
    }
    
    console.log(`Badge ${badge.Badge}: Attribute ${badge.Attribute} mapped to ${buildAttribute}`);
    
    if (buildAttribute && build[buildAttribute]) {
      const rating = build[buildAttribute];
      
      // Check if the attribute rating meets the requirements for any badge level
      let level = null;
      if (rating >= (badge.Legend || badge.HoF + 5 || 99)) level = "Hall of Fame";
      else if (rating >= (badge.HoF || badge.Gold + 5 || 94)) level = "Gold";
      else if (rating >= (badge.Gold || badge.Silver + 5 || 85)) level = "Silver";
      else if (rating >= (badge.Bronze || 75)) level = "Bronze";
      
      // Check for height restrictions on max badge level
      const maxLevelForHeight = badgeMaxLevels[badge.Badge];
      if (maxLevelForHeight) {
        // Convert our level to the format used in the height restriction data
        const mappedLevel = {
          "Hall of Fame": "HoF",
          "Gold": "Gold",
          "Silver": "Silver",
          "Bronze": "Bronze"
        }[level] || "";
        
        // If our badge level exceeds what's allowed at this height, cap it
        if (badgeLevelValues[mappedLevel] > badgeLevelValues[maxLevelForHeight]) {
          // Cap the level to what's allowed for this height
          if (maxLevelForHeight === "Legend") level = "Hall of Fame";
          else if (maxLevelForHeight === "HoF") level = "Hall of Fame";
          else if (maxLevelForHeight === "Gold") level = "Gold";
          else if (maxLevelForHeight === "Silver") level = "Silver";
          else if (maxLevelForHeight === "Bronze") level = "Bronze";
          else level = null; // Badge not available at this height
        }
      }
      
      // Only record this badge if it's available at this height and not already at a higher level
      if (level && (!badgeLevels[badge.Badge] || getBadgeValue(level) > getBadgeValue(badgeLevels[badge.Badge].level))) {
        badgeLevels[badge.Badge] = {
          level,
          category: badge.Category
        };
      }
    }
  });
  
  // Organize badges by category and select top badges for each
  const categories = [
    'Finishing', 'Shooting', 'Playmaking', 'Defense', 'Rebounding', 
    'Inside Scoring', 'Outside Scoring', 'General', 'General Offense', 'All Around'
  ];
  
  categories.forEach(category => {
    const categoryBadges = Object.entries(badgeLevels)
      .filter(([_, data]) => data.category === category || 
                            (category === 'Shooting' && data.category === 'Outside Scoring') ||
                            (category === 'Finishing' && data.category === 'Inside Scoring'))
      .sort((a, b) => {
        return getBadgeValue(b[1].level) - getBadgeValue(a[1].level);
      })
      .slice(0, 3); // Top 3 badges per category
    
    categoryBadges.forEach(([badge, data]) => {
      topBadges.badges[badge] = data.level;
    });
  });
  
  // Assign Tier 1 and Tier 2 special badges (HOF and Gold)
  const hofBadges = Object.entries(badgeLevels)
    .filter(([_, data]) => data.level === "Hall of Fame")
    .map(([badge]) => badge);
  
  const goldBadges = Object.entries(badgeLevels)
    .filter(([_, data]) => data.level === "Gold")
    .map(([badge]) => badge);
  
  if (hofBadges.length > 0) {
    topBadges.hof = hofBadges[0];
  }
  
  if (goldBadges.length > 0) {
    topBadges.gold = goldBadges[0];
  }
  
  return topBadges;
}

// Helper to get numeric value for badge level comparison
function getBadgeValue(level) {
  const levels = {
    "Hall of Fame": 4,
    "Gold": 3,
    "Silver": 2,
    "Bronze": 1
  };
  return levels[level] || 0;
}

module.exports = {
  calculateTopBadges,
  getBadgeValue
}; 
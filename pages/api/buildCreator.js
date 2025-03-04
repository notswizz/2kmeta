import OpenAI from 'openai';

// Helper function to convert height string to inches
const heightToInches = (heightStr) => {
  if (!heightStr) return null;
  if (typeof heightStr === 'number') return heightStr;
  
  const match = heightStr.match(/(\d+)'(\d+)"?/);
  if (match) {
    const feet = parseInt(match[1]);
    const inches = parseInt(match[2]);
    return feet * 12 + inches;
  }
  return null;
};

const ATTRIBUTE_TOTAL_CAPS = {
  'PG': 610,
  'SG': 605,
  'SF': 600,
  'PF': 595,
  'C': 590
};

// Attribute weight ranges for calculations
const ATTRIBUTE_RANGES = [
  { name: "25-74", min: 25, max: 74 },
  { name: "75-79", min: 75, max: 79 },
  { name: "80-84", min: 80, max: 84 },
  { name: "85-89", min: 85, max: 89 },
  { name: "90-94", min: 90, max: 94 },
  { name: "95-98", min: 95, max: 98 },
  { name: "99", min: 99, max: 99 }
];

// Position mapping for build names API
const POSITION_MAPPING = {
  'PG': 'pg',
  'SG': 'sg',
  'SF': 'sf',
  'PF': 'pf',
  'C': 'c'
};

// Attribute mapping between our keys and the API attribute names
const ATTRIBUTE_NAME_MAPPING = {
  // Our attribute name to all possible API attribute names
  'closeShot': ['close shot', 'closeshot', 'close_shot'],
  'drivingLayup': ['driving layup', 'drivinglayup', 'layup', 'driving_layup'],
  'drivingDunk': ['driving dunk', 'drivingdunk', 'driving_dunk'],
  'standingDunk': ['standing dunk', 'standingdunk', 'standing_dunk'], 
  'postControl': ['post control', 'postcontrol', 'post_control'],
  'midrange': ['mid-range shot', 'midrange shot', 'midrangeshot', 'midrange_shot', 'mid-rangeshot'],
  'threePoint': ['three-point shot', 'threepoint shot', 'threepointshot', 'three_pointer', 'three-pointer', 'three-pointshot'],
  'freeThrow': ['free throw', 'freethrow', 'free_throw'],
  'passAccuracy': ['pass accuracy', 'passaccuracy', 'pass_accuracy'],
  'ballHandle': ['ball handle', 'ballhandle', 'ball_handle'],
  'speedWithBall': ['speed with ball', 'speedwithball', 'speed_with_ball'],
  'interiorDefense': ['interior defense', 'interiordefense', 'interior_defense'],
  'perimeterDefense': ['perimeter defense', 'perimeterdefense', 'perimeter_defense'],
  'steal': ['steal'],
  'block': ['block'],
  'offensiveRebound': ['offensive rebound', 'offensiverebound', 'offensive_rebound'],
  'defensiveRebound': ['defensive rebound', 'defensiverebound', 'defensive_rebound'],
  'speed': ['speed'],
  'acceleration': ['acceleration', 'agility'],
  'strength': ['strength'],
  'vertical': ['vertical'],
  'stamina': ['stamina']
};

// Mapping for the official build names API (using their specific keys)
const OFFICIAL_BUILD_ATTRIBUTE_MAPPING = {
  'closeShot': 'Close_Shot',
  'drivingLayup': 'Layup',
  'drivingDunk': 'Driving_Dunk',
  'standingDunk': 'Standing_Dunk',
  'postControl': 'Post_Control',
  'midrange': 'Midrange_Shot',
  'threePoint': 'Three_Pointer',
  'freeThrow': 'Free_Throw',
  'passAccuracy': 'Pass_Accuracy',
  'ballHandle': 'Ball_Handle',
  'speedWithBall': 'Speed_With_Ball',
  'interiorDefense': 'Interior_Defense',
  'perimeterDefense': 'Perimeter_Defense',
  'steal': 'Steal',
  'block': 'Block',
  'offensiveRebound': 'Offensive_Rebound',
  'defensiveRebound': 'Defensive_Rebound',
  'speed': 'Speed',
  'acceleration': 'Agility',
  'strength': 'Strength',
  'vertical': 'Vertical'
};

// Create reverse lookup for faster attribute matching
const ATTRIBUTE_REVERSE_MAPPING = {};
Object.entries(ATTRIBUTE_NAME_MAPPING).forEach(([ourName, apiNames]) => {
  apiNames.forEach(apiName => {
    const normalizedName = apiName.toLowerCase().replace(/[\s-_]+/g, '');
    ATTRIBUTE_REVERSE_MAPPING[normalizedName] = ourName;
  });
});

// Helper function to map API attribute names to our internal names
function mapAttributeName(apiAttributeName) {
  if (!apiAttributeName) return null;
  
  const normalized = apiAttributeName.toLowerCase().replace(/[\s-_]+/g, '');
  return ATTRIBUTE_REVERSE_MAPPING[normalized] || normalized;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Processing build request:', prompt);

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // STEP 1: Analyze the prompt to understand what the user is looking for
    const analysisResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an NBA 2K25 build expert. Analyze the user's request and identify what kind of player build they want.
          Extract the following information from their query:
          1. Position (PG, SG, SF, PF, C)
          2. Play style or archetype they want (e.g., shooter, slasher, defender, etc.)
          3. Key attributes they prioritize (shooting, finishing, defense, playmaking, etc.)
          4. Any physical preferences (height, weight, wingspan)
          5. Specific badges they might want
          6. Game mode (Park, Rec, MyCareer, etc.)
          
          Output your analysis in JSON format with these fields:
          {
            "position": "string or null",
            "playStyle": "string or null",
            "keyAttributes": ["array of strings"],
            "physicalPreferences": {
              "height": "string or null", 
              "weight": "string or null",
              "wingspan": "string or null"
            },
            "badges": ["array of strings or empty"],
            "gameMode": "string or null"
          }`
        },
        {
          role: 'user',
          content: `User request: "${prompt}"`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    // Parse the analysis result
    const analysisResult = JSON.parse(analysisResponse.choices[0].message.content);
    console.log("Analysis result:", analysisResult);

    // STEP 2: Fetch NBA 2K Lab data from the correct endpoints
    console.log("Fetching NBA 2K Lab data...");
    
    const [
      attributeWeightsResponse,
      badgeUnlocksResponse,
      buildNamesResponse,
      badgeMaxLevelByHeightResponse
    ] = await Promise.all([
      fetch('https://www.nba2klab.com/_next/data/K36eXiGRM86lm6X-5b3mg/en/nba2k-attribute-calculated-weights-heat.json'),
      fetch('https://www.nba2klab.com/_next/data/K36eXiGRM86lm6X-5b3mg/en/badge-requirements.json'),
      fetch('https://www.nba2klab.com/_next/data/K36eXiGRM86lm6X-5b3mg/en/build-names.json'),
      fetch('https://www.nba2klab.com/_next/data/K36eXiGRM86lm6X-5b3mg/en/badge-max-level-by-height.json')
    ]);

    // Process the responses and handle any error cases
    if (!attributeWeightsResponse.ok || !badgeUnlocksResponse.ok || !buildNamesResponse.ok || !badgeMaxLevelByHeightResponse.ok) {
      throw new Error("Failed to fetch data from NBA 2K Lab API");
    }

    const attributeWeights = await attributeWeightsResponse.json();
    const badgeUnlocks = await badgeUnlocksResponse.json();
    const buildNames = await buildNamesResponse.json();
    const badgeMaxLevelByHeight = await badgeMaxLevelByHeightResponse.json();

    console.log("NBA 2K Lab data fetched successfully");
    
    // Log structure to diagnose
    console.log("Badge data keys:", Object.keys(badgeUnlocks.pageProps));
    
    // Validate the data structure
    if (!attributeWeights.pageProps?.attributeCalculatedWeights) {
      throw new Error("Invalid attribute weights data structure");
    }
    
    // Check for either badgeRequirements or badgeUnlocks
    const badgeData = badgeUnlocks.pageProps.badgeUnlocks || badgeUnlocks.pageProps.badgeRequirements;
    if (!badgeData) {
      throw new Error("Invalid badge data structure - missing both badgeUnlocks and badgeRequirements");
    }

    if (!buildNames.pageProps?.buildNames) {
      throw new Error("Invalid build names data structure");
    }
    
    if (!badgeMaxLevelByHeight.pageProps?.badgeTiers) {
      throw new Error("Invalid badge max level by height data structure");
    }

    // Calculate optimal height based on position and playstyle
    let recommendedHeight = "";
    let heightInInches = null;
    
    if (analysisResult.physicalPreferences?.height) {
      heightInInches = heightToInches(analysisResult.physicalPreferences.height);
    } else {
      // Default heights by position and playstyle
      const positionHeights = {
        "PG": { default: "6'2\"", shooter: "6'4\"", defender: "6'5\"", slasher: "6'3\"" },
        "SG": { default: "6'5\"", shooter: "6'6\"", defender: "6'7\"", slasher: "6'5\"" },
        "SF": { default: "6'8\"", shooter: "6'7\"", defender: "6'9\"", slasher: "6'8\"" },
        "PF": { default: "6'10\"", shooter: "6'9\"", defender: "6'11\"", slasher: "6'10\"" },
        "C": { default: "7'0\"", shooter: "6'10\"", defender: "7'2\"", slasher: "7'0\"" }
      };
      
      const position = analysisResult.position || "SF";
      const playStyle = analysisResult.playStyle?.toLowerCase() || "default";
      
      let playstyleKey = "default";
      if (playStyle.includes("shoot") || playStyle.includes("sharp")) {
        playstyleKey = "shooter";
      } else if (playStyle.includes("defend") || playStyle.includes("lock")) {
        playstyleKey = "defender";
      } else if (playStyle.includes("slash") || playStyle.includes("finish")) {
        playstyleKey = "slasher";
      }
      
      recommendedHeight = positionHeights[position]?.[playstyleKey] || positionHeights[position]?.default || "6'8\"";
      heightInInches = heightToInches(recommendedHeight);
    }
    
    // Filter attribute weights for this height
    const attributeWeightsSample = attributeWeights.pageProps.attributeCalculatedWeights
      .filter(w => heightToInches(w.Height) === heightInInches)
      .slice(0, 10);

    // Get badge requirements sample
    const badgeRequirementsSample = badgeData.slice(0, 5);

    // STEP 3: Generate optimized build based on attribute caps and badge thresholds
    const buildGenerationResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an NBA 2K25 build optimization expert. Your task is to create an optimized build configuration based on the user's preferences and 2K Lab data. You'll set ATTRIBUTE CAPS (maximum potential) for each attribute, NOT current values.

          The user's preferences have been analyzed as:
          ${JSON.stringify(analysisResult, null, 2)}
          
          Key information about NBA 2K25 builds:
          1. Each position has a total attribute point cap (PG: 610, SG: 605, SF: 600, PF: 595, C: 590)
          2. Attribute costs increase exponentially at higher ratings
          3. Taller players pay more attribute points for certain skills (shooting, ball handling)
          4. Specific badge tiers require minimum attribute thresholds
          5. Some badges are restricted by height
          
          Create a build with these specifications:
          1. Position: ${analysisResult.position || "Based on playstyle and preferences"}
          2. Height: ${recommendedHeight || "Optimal for position and playstyle"}
          3. Weight and Wingspan: Optimized for the playstyle
          4. Attribute Caps: Set to maximize effectiveness for the playstyle
          5. Badge Selection: Identify key badges that match the playstyle
          
          Follow these attribute cap guidelines:
          - Prioritize attributes for the key playstyle
          - Meet minimum thresholds for important badges
          - Distribute attribute points efficiently based on attribute costs
          - Set lower caps for non-essential attributes
          - Target key attribute breakpoints that unlock specific animations

          Return a complete build configuration in JSON format:
          {
            "position": "string",
            "height": number (in inches),
            "weight": number,
            "wingspan": number,
            "closeShot": number,
            "drivingLayup": number,
            "drivingDunk": number,
            "standingDunk": number,
            "postControl": number,
            "midrange": number,
            "threePoint": number,
            "freeThrow": number,
            "passAccuracy": number,
            "ballHandle": number,
            "speedWithBall": number,
            "interiorDefense": number,
            "perimeterDefense": number,
            "steal": number,
            "block": number,
            "offensiveRebound": number,
            "defensiveRebound": number,
            "speed": number,
            "acceleration": number,
            "strength": number,
            "vertical": number,
            "stamina": number,
            "badges": {
              "badgeName1": "level",
              "badgeName2": "level"
            },
            "buildName": "string",
            "tier1MaxPlusOne": "string (HoF special badge)",
            "tier2MaxPlusOne": "string (Gold special badge)"
          }`
        },
        {
          role: 'user',
          content: `
          User preferences: ${JSON.stringify(analysisResult)}
          Recommended height: ${recommendedHeight} (${heightInInches} inches)
          Total attribute cap: ${ATTRIBUTE_TOTAL_CAPS[analysisResult.position] || 600} points

          Badge requirements sample:
          ${JSON.stringify(badgeRequirementsSample)}
          
          Attribute weights sample for this height:
          ${JSON.stringify(attributeWeightsSample)}
          
          Please create an optimized build configuration that sets ATTRIBUTE CAPS (not current values) based on these preferences and constraints.`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    // Parse the build result
    const buildResult = JSON.parse(buildGenerationResponse.choices[0].message.content);
    console.log("Generated build caps:", buildResult);
    
    // Add overall rating estimation
    const estimatedOverall = calculateOverallRating(buildResult);
    buildResult.overall = estimatedOverall;

    // Calculate top badge recommendations
    const topBadges = calculateTopBadges(buildResult, badgeData, badgeMaxLevelByHeight);
    buildResult.badges = topBadges.badges;
    buildResult.tier1MaxPlusOne = topBadges.hof;
    buildResult.tier2MaxPlusOne = topBadges.gold;
    
    // Find matching build name from NBA2KLab database
    const officialBuildName = findOfficialBuildName(buildResult, buildNames.pageProps.buildNames);
    
    // If we found an official build name, use it, otherwise use our generated one
    if (officialBuildName) {
      buildResult.buildName = officialBuildName;
    } else if (!buildResult.buildName) {
      buildResult.buildName = generateBuildName(buildResult, analysisResult);
    }

    // Return the full build data
    return res.status(200).json({
      analysis: analysisResult,
      build: buildResult
    });
    
  } catch (error) {
    console.error('Error in build creator API:', error);
    return res.status(500).json({
      error: 'An error occurred during build creation',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Helper function to calculate an estimated overall rating
function calculateOverallRating(build) {
  // Weights by category (these are approximations)
  const weights = {
    finishing: 0.18,
    shooting: 0.18,
    playmaking: 0.18,
    defense: 0.18,
    physical: 0.14,
    general: 0.14
  };
  
  // Calculate category averages
  const finishing = (build.closeShot + build.drivingLayup + build.drivingDunk + build.standingDunk + build.postControl) / 5;
  const shooting = (build.midrange + build.threePoint + build.freeThrow) / 3;
  const playmaking = (build.passAccuracy + build.ballHandle + build.speedWithBall) / 3;
  const defense = (build.interiorDefense + build.perimeterDefense + build.steal + build.block + 
                   build.offensiveRebound + build.defensiveRebound) / 6;
  const physical = (build.speed + build.acceleration + build.strength + build.vertical + build.stamina) / 5;
  
  // Calculate weighted overall
  const overall = Math.round(
    (finishing * weights.finishing) +
    (shooting * weights.shooting) +
    (playmaking * weights.playmaking) +
    (defense * weights.defense) +
    (physical * weights.physical)
  );
  
  return overall;
}

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

// Function to match generated build with official build names from NBA2KLab
function findOfficialBuildName(build, officialBuilds) {
  if (!officialBuilds || !Array.isArray(officialBuilds) || officialBuilds.length === 0) {
    return null;
  }
  
  try {
    // Convert position to the format used in the API
    const position = POSITION_MAPPING[build.position] || 'pg';
    
    // Filter builds by position
    const positionBuilds = officialBuilds.filter(b => b.position === position);
    
    if (positionBuilds.length === 0) {
      return null;
    }
    
    // Calculate similarity scores
    const buildScores = positionBuilds.map(officialBuild => {
      let score = 0;
      let attributeCount = 0;
      
      // Calculate attribute differences
      for (const [ourKey, theirKey] of Object.entries(OFFICIAL_BUILD_ATTRIBUTE_MAPPING)) {
        if (build[ourKey] !== undefined && officialBuild[theirKey] !== undefined) {
          // Weight differences based on attribute values
          const diff = Math.abs(build[ourKey] - officialBuild[theirKey]);
          if (diff <= 3) {
            score += 10; // Very close match
          } else if (diff <= 7) {
            score += 5; // Close match
          } else if (diff <= 15) {
            score += 2; // Somewhat similar
          }
          attributeCount++;
        }
      }
      
      return {
        name: officialBuild.name,
        score: attributeCount > 0 ? score / attributeCount : 0
      };
    });
    
    // Sort by score (highest first)
    buildScores.sort((a, b) => b.score - a.score);
    
    // Return the name of the best match if it's a good enough match
    return buildScores[0]?.score >= 3 ? buildScores[0].name : null;
  } catch (error) {
    console.error("Error finding official build name:", error);
    return null;
  }
}

// Generate a build name if no official match is found
function generateBuildName(build, analysis) {
  // Map of attributes to playstyle components
  const playstyleMap = {
    // High shooting + playmaking
    shootingPlaymaker: (build.threePoint >= 80 && build.ballHandle >= 80),
    // High shooting + defense
    threeDWing: (build.threePoint >= 80 && build.perimeterDefense >= 80),
    // High finishing + defense
    twoWayFinisher: (build.drivingDunk >= 85 && build.perimeterDefense >= 80),
    // High defense all around
    lockdownDefender: (build.perimeterDefense >= 85 && build.steal >= 85),
    // High finishing
    slasher: (build.drivingDunk >= 90),
    // High shooting
    sharpshooter: (build.threePoint >= 90),
    // High playmaking
    playmaker: (build.ballHandle >= 90 && build.passAccuracy >= 85),
    // High interior defense
    paintBeast: (build.interiorDefense >= 85 && build.block >= 85 && build.defensiveRebound >= 85),
    // High post scoring
    postScorer: (build.postControl >= 85),
    // All-around scoring
    scoringMachine: (build.drivingDunk >= 80 && build.threePoint >= 80),
    // Default
    allAround: true
  };
  
  // Determine primary playstyle
  let buildName = "All-Around Player";
  
  if (playstyleMap.shootingPlaymaker) buildName = "Offensive Threat";
  else if (playstyleMap.threeDWing) buildName = "3&D Wing";
  else if (playstyleMap.twoWayFinisher) buildName = "Two-Way Finisher";
  else if (playstyleMap.lockdownDefender) buildName = "Lockdown Defender";
  else if (playstyleMap.sharpshooter) buildName = "Sharpshooter";
  else if (playstyleMap.playmaker) buildName = "Playmaker";
  else if (playstyleMap.slasher) buildName = "Slasher";
  else if (playstyleMap.paintBeast) buildName = "Paint Beast";
  else if (playstyleMap.postScorer) buildName = "Post Scorer";
  else if (playstyleMap.scoringMachine) buildName = "Scoring Machine";
  
  // If user specified a playStyle, prioritize it
  if (analysis.playStyle) {
    const userPlayStyle = analysis.playStyle.toLowerCase();
    if (userPlayStyle.includes("sharp") || userPlayStyle.includes("shoot")) {
      if (build.perimeterDefense >= 80) return "3&D Wing";
      return "Sharpshooter";
    }
    if (userPlayStyle.includes("slash") || userPlayStyle.includes("finish")) {
      if (build.perimeterDefense >= 80) return "Two-Way Finisher";
      return "Slasher";
    }
    if (userPlayStyle.includes("play") || userPlayStyle.includes("pass")) {
      return "Playmaker";
    }
    if (userPlayStyle.includes("def") || userPlayStyle.includes("lock")) {
      return "Lockdown Defender";
    }
    if (userPlayStyle.includes("post") || userPlayStyle.includes("center")) {
      return "Paint Beast";
    }
  }
  
  return buildName;
} 
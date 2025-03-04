const { POSITION_MAPPING, OFFICIAL_BUILD_ATTRIBUTE_MAPPING } = require('./utils');

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

module.exports = {
  findOfficialBuildName,
  generateBuildName
}; 
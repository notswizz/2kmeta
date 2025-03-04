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

module.exports = {
  calculateOverallRating
}; 
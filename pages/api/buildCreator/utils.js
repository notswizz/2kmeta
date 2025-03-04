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

module.exports = {
  heightToInches,
  ATTRIBUTE_TOTAL_CAPS,
  ATTRIBUTE_RANGES,
  POSITION_MAPPING,
  ATTRIBUTE_NAME_MAPPING,
  OFFICIAL_BUILD_ATTRIBUTE_MAPPING,
  ATTRIBUTE_REVERSE_MAPPING,
  mapAttributeName
}; 
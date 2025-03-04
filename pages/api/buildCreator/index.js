import OpenAI from 'openai';
import { heightToInches, ATTRIBUTE_TOTAL_CAPS } from './utils';
import { calculateTopBadges } from './badgeUtils';
import { findOfficialBuildName, generateBuildName } from './buildNameUtils';
import { calculateOverallRating } from './ratingUtils';

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
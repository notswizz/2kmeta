import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Fetch all builds from the NBA 2K Lab API
    const buildsResponse = await fetch('https://www.nba2klab.com/.netlify/functions/builds');
    
    if (!buildsResponse.ok) {
      throw new Error('Failed to fetch builds from NBA 2K Lab API');
    }
    
    const builds = await buildsResponse.json();
    console.log(`Loaded ${builds.length} builds from API`);

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
          content: `You are an NBA 2K25 build expert. Your task is to analyze the user's request and identify what kind of player build they are looking for.
          Extract the following information from their query:
          1. Position (PG, SG, SF, PF, C) they're interested in
          2. Play style or archetype they want (e.g., shooter, slasher, defender, etc.)
          3. Key attributes they prioritize (shooting, finishing, defense, playmaking, etc.)
          4. Any other specific requirements (height, weight, wingspan preferences)
          5. Specific badges they might want
          
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
    
    // STEP 2: Use the analysis to find the best matching build
    // We'll have the AI scan all builds and score them based on the analysis
    const matchResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an NBA 2K25 build matcher. Based on the user's preferences, thoroughly analyze ALL available builds to find the BEST matching build.
          
          The user's preferences have been analyzed as:
          ${JSON.stringify(analysisResult, null, 2)}
          
          Follow this scoring system to evaluate each build (0-100 points total):
          1. Position match (0-30 points): 
             - Exact position match: 30 points
             - Similar position (e.g., SG/SF): 15 points
             - No match: 0 points
          
          2. Play style match (0-25 points):
             - Score based on how well the build's attributes match the requested play style
             - For shooters, prioritize three-point and mid-range shooting
             - For slashers, prioritize driving dunk, layup, and speed
             - For defenders, prioritize perimeter/interior defense, block, and steal
             - For playmakers, prioritize ball handling and pass accuracy
          
          3. Key attributes match (0-25 points):
             - Score each requested attribute (divide 25 by the number of key attributes)
          
          4. Physical attributes match (0-10 points):
             - Height match: 4 points
             - Weight match: 3 points
             - Wingspan match: 3 points
          
          5. Badge match (0-10 points):
             - Score based on matching badges
          
          CAREFULLY SCAN ALL BUILDS - don't just pick the first decent match!
          
          Return the index (0-based) of the best overall matching build as a single number.`
        },
        {
          role: 'user',
          content: `Available builds (${builds.length} total):
          ${JSON.stringify(builds)}
          
          Return ONLY the index number (0-based) of the best matching build.`
        }
      ],
      temperature: 0.1,
      max_tokens: 10,
    });

    // Extract the index from the response
    const buildIndexString = matchResponse.choices[0].message.content.trim();
    const buildIndex = parseInt(buildIndexString);
    
    if (isNaN(buildIndex) || buildIndex < 0 || buildIndex >= builds.length) {
      return res.status(500).json({ 
        error: 'Invalid build index returned by AI',
        aiResponse: buildIndexString
      });
    }

    console.log(`Selected build index: ${buildIndex} out of ${builds.length} total builds`);

    // Return the matched build along with the analysis
    const matchedBuild = builds[buildIndex];
    return res.status(200).json({ 
      build: matchedBuild,
      analysis: analysisResult
    });
    
  } catch (error) {
    console.error('Error in builds API:', error);
    return res.status(500).json({
      error: 'An error occurred during the build search',
      details: error.message,
    });
  }
} 
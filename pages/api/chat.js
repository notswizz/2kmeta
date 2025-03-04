import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required and must be an array' });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return res.status(200).json({
      message: response.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({
      error: 'An error occurred during the request to OpenAI',
      details: error.message,
    });
  }
} 
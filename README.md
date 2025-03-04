# NBA 2K25 AI Assistant

An AI-powered chatbot application designed specifically for NBA 2K25 players. Built with Next.js and Tailwind CSS, this assistant uses OpenAI's GPT-4o model to provide game tips, player stats, strategy advice, and answer basketball-related questions.

## Features

- NBA 2K25-themed chat interface
- Integration with OpenAI's GPT-4o model
- Basketball and gaming-focused responses
- Responsive design with Tailwind CSS
- Loading indicators and modern UI elements

## Screenshots

![NBA 2K25 Assistant Screenshot](screenshot.png)

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   OPENAI_MODEL=gpt-4o
   ```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How It Works

1. The user enters a basketball or NBA 2K25 related question
2. The message is sent to the Next.js API route
3. The API route forwards the message to OpenAI's API with specific NBA 2K25 context
4. The response from OpenAI is returned to the client
5. The response is displayed in the NBA 2K25-themed chat interface

## Use Cases

- Get tips for MyCAREER mode
- Learn strategies for MyTEAM
- Get player ratings and stats information
- Learn about game mechanics and controls
- Get advice for building the best team

## Security Notes

- The OpenAI API key is stored in a `.env.local` file which is not committed to the repository
- The API key is only used on the server side and is never exposed to the client

## License

MIT

# Gemini Chat - AI Powered Conversations

A production-ready web chatbot built with Next.js 15, TypeScript, and Google's Gemini 2.0 Flash API. Features modern UI, dark/light themes, chat history, reminders, and text-to-speech capabilities.

## Features

### Core Features
- ✅ **Cookie-Based Authentication** - Securely store encrypted Gemini session cookies locally
- ✅ **Real-time Chat** - Conversations with Gemini 2.0 Flash AI
- ✅ **Chat History** - Persistent conversation storage with sidebar navigation
- ✅ **Dark/Light Themes** - Beautiful theme system with smooth transitions
- ✅ **Responsive Design** - Works perfectly on desktop, tablet, and mobile

### Advanced Features
- ✅ **Code Syntax Highlighting** - Beautiful code blocks with copy functionality
- ✅ **LaTeX Math Support** - Render mathematical expressions
- ✅ **Text-to-Speech** - Audio generation for AI responses (TTS ready)
- ✅ **Smart Reminders** - Parse natural language to set reminders
- ✅ **Proactive Messages** - AI sends timely reminder notifications

### UI/UX Features
- ✅ **Modern Design** - Clean, professional interface with Tailwind CSS
- ✅ **Loading States** - Smooth animations and typing indicators
- ✅ **Error Handling** - User-friendly error messages and retry options
- ✅ **Empty States** - Helpful guidance for new users
- ✅ **Conversation Management** - Rename, delete, and organize chats

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand with persistence
- **AI Integration**: Gemini web endpoints proxied with session cookies (SAPISIDHASH)
- **Markdown**: react-markdown with syntax highlighting
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites
- Node.js 18+ 
- Google account with access to gemini.google.com

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gemini-chat
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Capturing Your Gemini Cookies

1. Visit [https://gemini.google.com](https://gemini.google.com) and sign in
2. Open DevTools (`F12` or `Cmd+Opt+I`)
3. Navigate to the **Application** tab
4. Expand **Cookies** and select **https://gemini.google.com**
5. Select all cookie rows and copy them (`Cmd/Ctrl + C`)
6. Paste the cookie string into the Gemini Chat landing page

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── chat/          # Chat endpoint
│   │   └── tts/           # Text-to-speech endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── AuthPage.tsx       # Authentication screen
│   ├── ChatWindow.tsx     # Main chat interface
│   ├── Layout.tsx         # App layout
│   ├── MessageBubble.tsx  # Individual messages
│   ├── Sidebar.tsx        # Conversation list
│   └── ThemeToggle.tsx    # Dark/light toggle
├── hooks/                 # Custom React hooks
│   ├── useChat.ts         # Chat functionality
│   ├── useReminders.ts    # Reminder management
│   ├── useTheme.ts        # Theme management
│   └── useTTS.ts          # Text-to-speech
├── lib/                   # Utility functions
├── stores/                # Zustand state management
│   └── chatStore.ts       # Main app state
└── types/                 # TypeScript definitions
    └── index.ts           # Type definitions
```

## API Integration

### Chat API
- **Endpoint**: `/api/chat`
- **Method**: POST
- **Body**: `{ message: string, conversationHistory: Message[], cookies: string }`
- The server proxies requests to Gemini using the provided cookies and a computed `SAPISIDHASH` header.

### TTS API
- **Endpoint**: `/api/tts`
- **Method**: POST
- **Body**: `{ text: string, cookies: string }`
- Returns a `data:` URL containing the generated audio when available.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables if needed
4. Deploy!

The app is designed to work out-of-the-box with Vercel's serverless functions.

### Environment Variables

The app doesn't require any environment variables for basic functionality. Gemini session cookies are stored encrypted in the browser and proxied to the Gemini web API via the Next.js server routes.

## Features in Detail

### Reminder System
The app can parse natural language to create reminders:

- `"Remind me every 10 minutes"` - Creates recurring reminders
- `"Remind me in 5 minutes"` - Creates one-time reminders  
- `"Remind me at 3 PM"` - Creates scheduled reminders

### Theme System
- **Dark Mode**: Default theme with dark backgrounds and blue accents
- **Light Mode**: Clean theme with light backgrounds and professional styling
- Theme preference is automatically saved and restored

### Chat Features
- **Streaming Responses**: See AI responses as they're generated
- **Code Highlighting**: Beautiful syntax highlighting for all programming languages
- **Copy Code**: One-click code copying with visual feedback
- **Message Timestamps**: Hover to see when messages were sent
- **Auto-scroll**: Chat automatically scrolls to new messages

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

Built with ❤️ using Next.js, TypeScript, and Google's Gemini AI.

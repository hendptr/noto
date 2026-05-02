# Noto

A bespoke, luxury-tier digital diary built with Next.js, tailored for the ultimate journaling experience. Noto combines minimalist aesthetics with powerful features like headless rich-text editing, web speech dictation, analytics, and intelligent memory surfacing.

## Features

- **Bespoke Minimalist UI**: A clean, distraction-free interface utilizing warm cream backgrounds, charcoal text, and elegant typography.
- **Silent Auto-Save**: Seamless, debounced auto-saving ensures you never lose a thought, without the clutter of "Save" buttons.
- **Headless Rich-Text**: An integrated Tiptap editor features a sleek "bubble menu" for formatting text (Bold, Italic, Quote) without toolbar clutter.
- **Voice Dictation**: Built-in support for the Web Speech API allows you to dictate your entries naturally in both English and Indonesian.
- **Happiness Level Tracking**: A sophisticated 1-10 dot-scale for logging your daily mood, paired with a full Analytics dashboard (`/insights`) powered by Recharts.
- **On This Day**: Time-travel through your memories with a subtle banner that surfaces your entries from exactly one year ago.
- **Writing Streaks & Word Count**: Keep yourself motivated with real-time word counting and consecutive daily writing streaks.
- **Weekly Reflections**: On Sundays, the app automatically prompts you with bespoke reflection questions to summarize your week.
- **Data Ownership**: Instantly export your entire life's history into a beautifully formatted Markdown (`.md`) file.
- **Print-Ready**: A dedicated CSS print stylesheet ensures that your diary looks stunning on physical paper or PDF.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: MongoDB (Mongoose)
- **Styling**: Tailwind CSS v4
- **Editor**: Tiptap
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Create a `.env.local` file and add your MongoDB connection string:
   ```env
   MONGO_URI=your_mongodb_connection_string
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser. The default unlock PIN is `0609`.

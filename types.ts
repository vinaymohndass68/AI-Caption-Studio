export enum ReplyStance {
  Agree = 'Agree',
  Disagree = 'Disagree',
  AgreeAppreciate = 'Agree & Appreciate',
  DisagreeSarcastic = 'Disagree & Sarcastic'
}

// Defining Tone enum used in ToneSelector component
export enum Tone {
  Professional = 'Professional',
  Friendly = 'Friendly',
  Empathetic = 'Empathetic',
  Analytical = 'Analytical',
  Concise = 'Concise',
  Humorous = 'Humorous',
  Sarcastic = 'Sarcastic',
  Poetic = 'Poetic',
  Inspirational = 'Inspirational',
  Provocative = 'Provocative'
}

export enum ImageStyle {
  Realistic = 'Realistic',
  Cartoon = 'Cartoon',
  Sketch = 'Sketch',
  OilPainting = 'Oil Painting',
  Cyberpunk = 'Cyberpunk',
  Minimalist = 'Minimalist',
  Vibrant = 'Vibrant'
}

export interface SolutionStep {
  title: string;
  description: string;
  tips?: string[];
}

export interface AnalysisResult {
  category: string;
  summary: string;
  solutionSteps?: SolutionStep[];
  estimatedDifficulty: string;
  estimatedTime: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: { data: string; mimeType: string };
  timestamp: number;
}
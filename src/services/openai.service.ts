import OpenAI from 'openai';

const SYSTEM_PROMPT = (jobTitle: string, company: string, context: string, extra: string) => `
You are an elite AI interview coach assistant helping a candidate during a live interview.

${jobTitle ? `Role they're interviewing for: ${jobTitle}` : ''}
${company ? `Company: ${company}` : ''}
${context ? `\nCandidate Background:\n${context}` : ''}
${extra ? `\nExtra Context/Instructions:\n${extra}` : ''}

Your job: When given an interview question, provide a CONCISE, IMPRESSIVE, and AUTHENTIC answer.

FORMAT YOUR RESPONSE LIKE THIS:
**Answer:**
[2-3 sentence direct answer]

**Key Points:**
• [Point 1]
• [Point 2]
• [Point 3 if needed]

${extra.toLowerCase().includes('coding') || extra.toLowerCase().includes('code') ? `
**Code:**
\`\`\`
[Code snippet if relevant]
\`\`\`
` : ''}

RULES:
- Be concise and scannable (candidate needs to read fast)
- Sound human and confident, not robotic
- Use STAR method for behavioral questions
- For technical questions, be precise and give examples
- Keep answer under 150 words unless it's a complex technical question
- Always respond in the same language as the question
`.trim();

export async function generateAnswer(
  question: string,
  {
    apiKey,
    model = 'gpt-4o-mini',
    jobTitle = '',
    company = '',
    resumeContext = '',
    extraContext = '',
    history = [] as { role: 'user' | 'assistant'; content: string }[],
    onStream,
  }: {
    apiKey: string;
    model?: string;
    jobTitle?: string;
    company?: string;
    resumeContext?: string;
    extraContext?: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
    onStream?: (chunk: string) => void;
  }
): Promise<string> {
  if (!apiKey) throw new Error('OpenAI API key not set. Go to Settings to add it.');

  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPT(jobTitle, company, resumeContext, extraContext),
    },
    ...history.slice(-6), // Keep last 6 messages for context
    {
      role: 'user',
      content: `Interview Question: ${question}`,
    },
  ];

  if (onStream) {
    // Streaming mode
    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
      max_tokens: 600,
      temperature: 0.7,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      fullText += delta;
      if (delta) onStream(delta);
    }
    return fullText;
  } else {
    // Non-streaming mode
    const response = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 600,
      temperature: 0.7,
    });
    return response.choices[0]?.message?.content || '';
  }
}

export async function analyzeScreenshot(
  imageDataUrl: string,
  {
    apiKey,
    jobTitle = '',
    company = '',
    resumeContext = '',
    extraContext = '',
    onStream,
  }: {
    apiKey: string;
    jobTitle?: string;
    company?: string;
    resumeContext?: string;
    extraContext?: string;
    onStream?: (chunk: string) => void;
  }
): Promise<{ question: string; answer: string }> {
  if (!apiKey) throw new Error('OpenAI API key not set.');

  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  // Step 1: Extract question from screenshot
  const extractionResponse = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageDataUrl, detail: 'high' },
          },
          {
            type: 'text',
            text: 'Look at this screen. Identify ANY interview question, coding problem, or question being asked. Return ONLY the question text, nothing else. If no question is visible, return "No question detected."',
          },
        ],
      },
    ],
    max_tokens: 300,
  });

  const question = extractionResponse.choices[0]?.message?.content?.trim() || 'No question detected.';

  if (question === 'No question detected.') {
    return { question, answer: '' };
  }

  // Step 2: Generate answer
  const answer = await generateAnswer(question, {
    apiKey,
    model: 'gpt-4o',
    jobTitle,
    company,
    resumeContext,
    extraContext,
    onStream,
  });

  return { question, answer };
}

export async function transcribeAudio(
  audioBlob: Blob,
  { apiKey, language = 'en' }: { apiKey: string; language?: string }
): Promise<string> {
  if (!apiKey) throw new Error('OpenAI API key not set.');

  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type });

  const response = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: language.toLowerCase().slice(0, 2),
    response_format: 'text',
  });

  return (response as unknown as string).trim();
}

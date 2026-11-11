interface Request {
  method?: string;
  body?: unknown;
}

interface Response {
  status: (code: number) => Response;
  json: (body: unknown) => void;
}

interface BoardItem {
  column: string;
  tasks: string[];
}

const isBoardData = (value: unknown): value is BoardItem[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as BoardItem).column === 'string' &&
      Array.isArray((item as BoardItem).tasks) &&
      (item as BoardItem).tasks.every((task) => typeof task === 'string')
  );

export default async function handler(request: Request, response: Response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const body = request.body as { boardData?: unknown } | undefined;
  if (!body || !isBoardData(body.boardData)) {
    response.status(400).json({ error: 'Invalid board data.' });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    response.status(500).json({ error: 'OpenRouter is not configured on the server.' });
    return;
  }

  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free';
  let openRouterResponse: globalThis.Response;
  try {
    openRouterResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
        'X-Title': 'DevBoardAi',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You summarize project boards for a corporate team. Be concise, practical, and use short paragraphs.',
          },
          {
            role: 'user',
            content: `Summarize the current progress, highlight blockers or empty stages, and suggest the next priority. Board data: ${JSON.stringify(body.boardData)}`,
          },
        ],
        temperature: 0.3,
      }),
    });
  } catch {
    response.status(502).json({ error: 'Could not connect to OpenRouter.' });
    return;
  }

  if (!openRouterResponse.ok) {
    const providerError = (await openRouterResponse.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    response.status(openRouterResponse.status).json({
      error:
        providerError?.error?.message ||
        `OpenRouter rejected the request (${openRouterResponse.status}).`,
    });
    return;
  }

  const data = (await openRouterResponse.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const summary = data.choices?.[0]?.message?.content?.trim();
  if (!summary) {
    response.status(502).json({ error: 'The AI response did not contain a summary.' });
    return;
  }

  response.status(200).json({ summary });
}

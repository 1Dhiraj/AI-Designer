require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173']
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemInstruction = `You are an expert web developer. When given a description, generate a complete, beautiful, single-file HTML website.

Rules:
- Output ONLY raw HTML code, nothing else. No markdown, no code fences, no explanation.
- Include all CSS in a <style> tag inside <head>.
- Include all JavaScript in a <script> tag before </body>.
- Make it visually stunning with modern design, gradients, animations where appropriate.
- Make it fully responsive and mobile-friendly.
- Use semantic HTML5.
- The page must be complete and functional on its own.
- Start your response directly with <!DOCTYPE html>

IMAGES — only include images when they genuinely improve the design:

- Use images for: product cards, hero sections, portfolio galleries, team/avatar photos, blog post thumbnails, restaurant menus, travel sites — places where a real photo adds value.
- Do NOT force images into: calculators, todo apps, dashboards, forms, utility tools, text-heavy pages, or anywhere a photo would feel out of place.

When images ARE needed, use https://loremflickr.com/{width}/{height}/{keyword}
- {keyword} = a specific descriptive word that matches EXACTLY what the image should show
- Use precise, visual keywords: "espresso", "sushi", "running-shoes", "mountain-lake", "office-desk", "golden-retriever"
- For multiple keywords (narrows the search): https://loremflickr.com/{width}/{height}/{keyword1},{keyword2}
- For avatar/person photos: https://loremflickr.com/80/80/portrait,person
- Pick sensible dimensions (e.g. 1200/600 hero, 400/300 card, 80/80 avatar)
- Examples:
    <img src="https://loremflickr.com/400/300/smartwatch" alt="Smartwatch">
    <img src="https://loremflickr.com/1200/600/city,skyline" alt="City hero">
    <img src="https://loremflickr.com/400/300/sushi,food" alt="Sushi dish">
    <img src="https://loremflickr.com/80/80/portrait,woman" alt="Team member">
    <img src="https://loremflickr.com/400/300/running,shoes" alt="Running shoes">

For icons and decorative shapes: use inline SVG, never an <img> tag.
For logos and brand marks: use CSS/text, not external images.
NEVER use src="" or src="#" or any broken/placeholder URL.`;

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction,
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 65536,
      },
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Kill the other process first:\n  Run: npx kill-port ${PORT}`);
    process.exit(1);
  } else {
    throw err;
  }
});

require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(express.static('public'));

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

When images ARE needed, use https://picsum.photos/seed/{seed}/{width}/{height}
- {seed} = a short descriptive word matching the content (e.g. "watch", "headphones", "city", "food", "avatar1")
- Each distinct image must have a UNIQUE seed so they look different from each other
- Pick sensible dimensions (e.g. 1200/600 hero, 400/300 card, 80/80 avatar)
- Examples:
    <img src="https://picsum.photos/seed/smartwatch/400/300" alt="Smartwatch">
    <img src="https://picsum.photos/seed/hero/1200/600" alt="Hero background">
    <img src="https://picsum.photos/seed/avatar1/80/80" alt="Team member">

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
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

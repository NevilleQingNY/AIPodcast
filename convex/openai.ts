import { action } from "./_generated/server";
import { v } from "convex/values";

import OpenAI from "openai";
import { SpeechCreateParams } from "openai/resources/audio/speech.mjs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const generateAudioAction = action({
  args: { input: v.string(), voice: v.string() },
  handler: async (_, { voice, input }) => {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as SpeechCreateParams['voice'],
      input,
    });

    const buffer = await mp3.arrayBuffer();

    return buffer;
  },
});

export const generatePodcastContentAction = action({
  args: {
    topic: v.string()
  },
  handler: async (ctx, { topic }) => {
    const prompt = `Generate a podcast script about "${topic}".

The script should flow naturally as a single, cohesive piece of text, without section headers or speaker labels. Include the following elements in order:

1. A brief introduction and greeting
2. An overview of the topic
3. The main content, covering 3-5 key points
4. A conclusion summarizing the main ideas
5. An outro with a call to action for listeners

Present the content in a conversational or narrative format that sounds natural and engaging, as if it's being spoken by a single host. Avoid using any formatting markers or labels within the text.`;

    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a professional podcast script writer." },
        { role: "user", content: prompt }
      ],
    });

    const content = stream?.choices?.[0]?.message?.content || '';

    return content
  },
});

export const generateThumbnailAction = action({
  args: { prompt: v.string() },
  handler: async (_, { prompt }) => {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    })

    const url = response.data[0].url;

    if (!url) {
      throw new Error('Error generating thumbnail');
    }

    const imageResponse = await fetch(url);
    const buffer = await imageResponse.arrayBuffer();
    return buffer;
  }
})
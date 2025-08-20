
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Task, Message, AudioParams, MidiSequence } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const parseJsonResponse = <T,>(responseText: string): T | null => {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Raw text:", responseText);
    return null;
  }
};

interface AiResponse {
  speaker: string;
  reply: string;
  action?: {
    type: 'CREATE_TASKS' | 'UPDATE_TASK';
    payload: any;
  };
}

export const getAiResponse = async (
  prompt: string,
  history: Message[],
  tasks: Task[],
  systemInstruction: string
): Promise<AiResponse | null> => {
  const conversationHistory = history.map(msg => `${msg.sender}: ${msg.text}`).join('\n');

  const fullPrompt = `
    ${systemInstruction}

    Current Project State (Tasks):
    ${JSON.stringify(tasks, null, 2)}

    Conversation History:
    ${conversationHistory}

    USER'S NEW PROMPT: "${prompt}"

    Your JSON response:
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5,
      },
    });

    const parsedResponse = parseJsonResponse<AiResponse>(response.text);
    
    if (!parsedResponse || typeof parsedResponse.reply !== 'string' || typeof parsedResponse.speaker !== 'string') {
        console.error("AI response was not in the expected format.", response.text);
        return { 
            speaker: 'Crucible System',
            reply: response.text || "I seem to be having trouble formulating a valid response. Please try again.",
        };
    }
    
    return parsedResponse;

  } catch (error) {
    console.error("Error communicating with AI:", error);
    return {
      speaker: 'Crucible System',
      reply: "I've encountered an error and cannot process your request. Please check the console for details and try again later."
    };
  }
};

export const generateWorkflowArtifact = async (
  systemInstruction: string,
  prompt: string,
  isJson: boolean = false
): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemInstruction}\n\nPROMPT:\n${prompt}`,
      config: {
        ...(isJson && { responseMimeType: 'application/json' }),
        temperature: 0.3, 
      },
    });
    
    let text = response.text.trim();
    
    if (isJson) {
        // Strip markdown fences if Gemini adds them
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = text.match(fenceRegex);
        if (match && match[2]) {
            text = match[2].trim();
        }
        // Basic validation
        JSON.parse(text);
    }

    return text;
  } catch (error) {
    console.error("Error generating workflow artifact:", error);
    if (error instanceof Error) {
        throw new Error(`AI generation failed: ${error.message}`);
    }
    throw new Error("An unknown AI error occurred.");
  }
};

export const getAiHint = async (context: string): Promise<string> => {
  const systemInstruction = `You are a creative and succinct audio engineering assistant. Based on the user's setup, provide a short, single-sentence tip or a fun fact. Be encouraging and creative. Your response must be 25 words or less.`;
  const fullPrompt = `${systemInstruction}\n\nUser's Setup: "${context}"\n\nYour hint:`;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 60,
      },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error getting AI hint:", error);
    return "Couldn't get a hint right now, try experimenting!";
  }
};

export const analyzeSound = async (context: string): Promise<string> => {
  const systemInstruction = `You are an expert sound designer and audio engineer. A user is experimenting with a live audio signal. Based on their setup, provide a concise, creative suggestion for what they could try next. Be inspiring and practical. For example, suggest tweaking a parameter, adding a different effect, or trying a certain vocal technique. The response should be a single, encouraging sentence.`;
  const fullPrompt = `${systemInstruction}\n\nUSER'S CURRENT SETUP:\n${context}\n\nYour suggestion:`;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.9,
        maxOutputTokens: 80,
      },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error getting sound analysis:", error);
    return "Could not get a suggestion right now. Keep experimenting!";
  }
};

const audioParamsSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: 'A cool, short name for the sound effect (e.g., "Cyber Laser", "Deep Hum").' },
        description: { type: Type.STRING, description: 'A brief, one-sentence description of the generated sound.' },
        waveform: { type: Type.STRING, enum: ['sine', 'square', 'sawtooth', 'triangle'], description: 'The oscillator waveform.' },
        baseFrequency: { type: Type.NUMBER, description: 'The fundamental frequency in Hz. Should be between 40 and 2000.' },
        duration: { type: Type.NUMBER, description: 'Total duration of the sound in seconds. Between 0.1 and 3 seconds.' },
        envelope: {
            type: Type.OBJECT,
            properties: {
                attack: { type: Type.NUMBER, description: 'Attack time in seconds (e.g., 0.01 for percussive, 0.5 for pad).' },
                decay: { type: Type.NUMBER, description: 'Decay time in seconds.' },
                sustain: { type: Type.NUMBER, description: 'Sustain level (0.0 to 1.0).' },
                release: { type: Type.NUMBER, description: 'Release time in seconds.' },
            },
        },
        filter: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['lowpass', 'highpass', 'bandpass', 'notch'] },
                frequency: { type: Type.NUMBER, description: 'Filter cutoff or center frequency in Hz.' },
                q: { type: Type.NUMBER, description: 'Q-factor or resonance of the filter.' },
            },
        },
        reverb: {
            type: Type.OBJECT,
            properties: {
                decay: { type: Type.NUMBER, description: 'Reverb tail decay time in seconds (0.1 to 5).' },
                mix: { type: Type.NUMBER, description: 'Wet/dry mix of the reverb (0.0 to 1.0).' },
            },
        },
    },
};

export const generateAudioParameters = async (prompt: string): Promise<AudioParams | null> => {
    const systemInstruction = `You are a creative sound designer AI. Your task is to translate a user's text prompt into a set of parameters for a simple audio synthesizer. Respond ONLY with a valid JSON object matching the provided schema.`;
    const fullPrompt = `${systemInstruction}\n\nUser prompt: "${prompt}"\n\nYour JSON response:`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: audioParamsSchema,
            },
        });
        return parseJsonResponse<AudioParams>(response.text);
    } catch (error) {
        console.error("Error generating audio parameters:", error);
        return null;
    }
};

const midiSequenceSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: 'A creative name for the MIDI sequence.' },
        description: { type: Type.STRING, description: 'A one-sentence description of the musical idea.' },
        bpm: { type: Type.INTEGER, description: 'The beats per minute (BPM) for the sequence, between 60 and 180.' },
        notes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    note: { type: Type.INTEGER, description: 'MIDI note number (60 is Middle C).' },
                    velocity: { type: Type.INTEGER, description: 'Velocity of the note (0-127).' },
                    start: { type: Type.NUMBER, description: 'Start time in beats from the beginning of the loop.' },
                    duration: { type: Type.NUMBER, description: 'Duration of the note in beats.' },
                },
            },
        },
    },
};

export const generateMidiSequence = async (prompt: string): Promise<MidiSequence | null> => {
    const systemInstruction = `You are an AI music composer. Generate a short, 2-bar (8-beat) musical sequence based on the user's prompt. Provide the output as a valid JSON object matching the schema.`;
    const fullPrompt = `${systemInstruction}\n\nUser prompt: "${prompt}"\n\nYour JSON response:`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: midiSequenceSchema,
            },
        });
        return parseJsonResponse<MidiSequence>(response.text);
    } catch (error) {
        console.error("Error generating MIDI sequence:", error);
        return null;
    }
};

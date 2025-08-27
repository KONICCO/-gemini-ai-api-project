import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-1.5-flash";

app.use(express.json());

const PORT = 8800;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));
function extractText(resp) {
  try {
    const text =
      resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      resp?.candidates?.[0]?.content?.parts?.[0]?.text ??
      resp?.response?.candidates?.[0]?.content?.text;

    return text ?? JSON.stringify(resp, null, 2);
  } catch (err) {
    console.error("Error extracting text:", err);
    return JSON.stringify(resp, null, 2);
  }
}

// Simple text completion endpoint
app.post("/generate-text", async (req, res) => {
  console.log("BODY:", req.body);
  try {
    const  text  = req.body.prompt;
    if (!text || typeof text !== "string") {
      return res.status(400).send("Invalid input: 'text' must be a string");
    }

    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [text],
    //   temperature: 0.5,
    //   maxTokens: 100,
    });
    res.send({result:extractText(resp)});
  } catch (error) {
    console.error("Error in /text endpoint:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const imageBase64 = req.file.buffer.toString('base64');
        const resp = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt },
                { inlineData: { mimeType: req.file.mimetype, data: imageBase64 } }
            ]
        });
        res.json({ result: extractText(resp) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})
//endpoint to handle file uploads
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const file = req.file;
        const fileType = file.mimetype;
        const fileBuffer = file.buffer;
        const fileBase64 = fileBuffer.toString('base64');
        const resp = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || "ringkas dokumen" },
                { inlineData: { mimeType: fileType, data: fileBase64 } }
            ]
        });
        res.json({ result: extractText(resp) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

//generate from audio file
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const audioBase64 = req.file.buffer.toString('base64');
        const resp = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || "transkrip audio" },
                { inlineData: { mimeType: req.file.mimetype, data: audioBase64 } }
            ]
        });
        res.json({ result: extractText(resp) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})
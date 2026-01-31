import express from 'express';
import dotenv from 'dotenv';
import WebSocket from 'ws';
import { voiceAgent } from './voiceAgent';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket server for audio streaming
const wss = new WebSocket.Server({ port: 3002 });
console.log('WebSocket server running on port 3002');

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'reset') {
        // Clear conversation history when voice/language changes
        console.log('Resetting conversation history');
        voiceAgent.resetConversation();
        return;
      }

      if (data.type === 'audio') {
        console.log('Received audio data, processing with voice:', data.voice);
        const response = await voiceAgent.processAudio(data.audio, data.voice);

        if (response && response.trim().length > 0) {
          const audioBuffer = await voiceAgent.generateSpeech(
            response,
            data.voice || 'en-IN-NeerjaNeural'
          );

          if (audioBuffer.length > 0) {
            const audioBase64 = audioBuffer.toString('base64');
            console.log('Sending response with audio, size:', audioBuffer.length);
            ws.send(
              JSON.stringify({
                type: 'response',
                text: response,
                audio: audioBase64,
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: 'response',
                text: response,
              })
            );
          }
        } else {
          ws.send(JSON.stringify({ type: 'no_response' }));
        }
      } else if (data.type === 'tts') {
        console.log('TTS request:', data.text);
        const audioBuffer = await voiceAgent.generateSpeech(
          data.text,
          data.voice || 'en-IN-NeerjaNeural'
        );
        const audioBase64 = audioBuffer.toString('base64');
        ws.send(
          JSON.stringify({
            type: 'audio',
            audio: audioBase64,
          })
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong. Try again.';
      console.error('WebSocket message error:', message, error);
      try {
        ws.send(
          JSON.stringify({
            type: 'error',
            message,
          })
        );
      } catch (_) {}
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Start voice agent (initialize services)
voiceAgent.initialize();

app.listen(PORT, () => {
  console.log(`Voice agent backend running on port ${PORT}`);
});

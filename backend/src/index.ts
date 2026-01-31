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

        // Only respond if we got a valid response
        if (response && response.trim().length > 0) {
          // Generate TTS audio
          const audioBuffer = await voiceAgent.generateSpeech(
            response,
            data.voice || 'en-IN-NeerjaNeural'
          );

          // Only send if we have audio; otherwise frontend will request TTS
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
            console.log('TTS returned empty buffer, sending text-only response');
            ws.send(
              JSON.stringify({
                type: 'response',
                text: response,
              })
            );
          }
        } else {
          console.log('No response generated, sending no_response');
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
      console.error('WebSocket message error:', error);
      try {
        ws.send(JSON.stringify({ type: 'no_response' }));
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

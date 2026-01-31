import { AccessToken } from 'livekit-server-sdk';

export async function generateAgentToken(roomName: string): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;

  const token = new AccessToken(apiKey, apiSecret, {
    identity: 'voice-agent',
    name: 'AI Voice Agent',
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return token.toJwt();
}

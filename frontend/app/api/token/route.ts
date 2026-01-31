import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    console.log('API Key:', apiKey);
    console.log('API Secret length:', apiSecret?.length);

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'LiveKit credentials not configured' },
        { status: 500 }
      );
    }

    // Generate unique room name for this session
    const roomName = `voice-chat-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    console.log('Room name:', roomName);

    // Create access token
    const token = new AccessToken(apiKey, apiSecret, {
      identity: `user-${Date.now()}`,
      name: 'Voice Chat User',
      ttl: '24h',
      metadata: JSON.stringify({
        project: 'voice-chat-mfk31cn4',
      }),
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();
    console.log('Token generated, length:', jwt.length);

    return NextResponse.json({
      token: jwt,
      roomName,
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

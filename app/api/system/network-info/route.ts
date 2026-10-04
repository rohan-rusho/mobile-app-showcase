import { NextResponse } from 'next/server';
import os from 'os';

function getLocalNetworkIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

export async function GET() {
  const port = process.env.PORT || 3000;
  const localIp = getLocalNetworkIp();
  return NextResponse.json({
    port: Number(port),
    localIp,
    localUrl: `http://localhost:${port}`,
    networkUrl: `http://${localIp}:${port}`
  });
}

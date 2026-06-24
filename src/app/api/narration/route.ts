import { NextResponse } from 'next/server';
import { CLIPS } from '@/data/narration';

// Lista os áudios FIXOS (id + texto) para o script de pré-gravação em MP3.
export async function GET() {
  return NextResponse.json({ clips: CLIPS });
}

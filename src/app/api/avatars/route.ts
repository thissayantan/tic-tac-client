import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Get the path to the public avatars directory
    const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
    
    // Read all files in the avatars directory
    const files = await fs.promises.readdir(avatarsDir);
    
    // Filter for image files and extract base names without extensions
    const avatarFiles = files
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .map(file => file.split('.')[0]);
    
    // Remove duplicates (in case there are multiple formats for the same avatar)
    const uniqueAvatars = [...new Set(avatarFiles)];
    
    return NextResponse.json({ avatars: uniqueAvatars });
  } catch (error) {
    console.error('Error reading avatars directory:', error);
    return NextResponse.json(
      { error: 'Failed to load avatars' },
      { status: 500 }
    );
  }
}

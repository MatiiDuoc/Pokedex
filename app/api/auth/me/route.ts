import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isRegistrationOpen } from '@/lib/registration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [user, registrationOpen] = await Promise.all([
    getCurrentUser(),
    isRegistrationOpen(),
  ]);

  return NextResponse.json(
    { user, registrationOpen },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

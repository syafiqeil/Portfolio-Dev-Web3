// app/api/user/budget/route.ts

import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/app/lib/session';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // 1. Ambil sesi pengguna (Secure)
    const session = await getIronSession(await cookies(), sessionOptions);

    if (!session.address) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Ambil saldo dari KV
    const budgetKey = `budget_${session.address.toLowerCase()}`;
    const rawBudget = await kv.get(budgetKey);
    
    // Pastikan formatnya angka
    const budget = rawBudget ? parseFloat(rawBudget as string) : 0;

    return NextResponse.json({ budget });
  } catch (error) {
    console.error("Error fetching budget:", error);
    return NextResponse.json({ error: 'Failed to fetch budget' }, { status: 500 });
  }
}
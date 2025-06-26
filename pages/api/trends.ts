import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { format, subWeeks, subMonths } from 'date-fns';

const prisma = new PrismaClient();

interface TrendDataPoint {
  week: string;
  date: string;
  helmet: number;
  vest: number;
  gloves: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrendDataPoint[] | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      const { period = 'week' } = req.query;

      // In a real application, this would query the database for actual trend data
      // For now, we'll generate simulated data based on the selected period

      let trendData: TrendDataPoint[] = [];

      if (period === 'week') {
        // Generate weekly data for the last 6 weeks
        trendData = Array.from({ length: 6 }).map((_, i) => {
          const date = subWeeks(new Date(), 5 - i);

          // Generate incident counts that decrease over time to show improvement trend
          const weekFactor = 6 - i; // Higher for earlier weeks

          return {
            week: `Week ${i + 1}`,
            date: format(date, 'MMM d'),
            helmet: Math.max(
              2,
              Math.floor(5 + weekFactor * 0.8 + Math.random() * 3)
            ),
            vest: Math.max(
              4,
              Math.floor(7 + weekFactor * 1.2 + Math.random() * 4)
            ),
            gloves: Math.max(
              6,
              Math.floor(10 + weekFactor * 1.5 + Math.random() * 5)
            ),
          };
        });
      } else if (period === 'month') {
        // Generate monthly data for the last 6 months
        trendData = Array.from({ length: 6 }).map((_, i) => {
          const date = subMonths(new Date(), 5 - i);

          // Generate incident counts that decrease over time to show improvement trend
          const monthFactor = 6 - i; // Higher for earlier months

          return {
            week: format(date, 'MMM yyyy'),
            date: format(date, 'MMM yyyy'),
            helmet: Math.max(
              10,
              Math.floor(20 + monthFactor * 3 + Math.random() * 10)
            ),
            vest: Math.max(
              15,
              Math.floor(25 + monthFactor * 4 + Math.random() * 12)
            ),
            gloves: Math.max(
              20,
              Math.floor(30 + monthFactor * 5 + Math.random() * 15)
            ),
          };
        });
      }

      res.status(200).json(trendData);
    } catch (error) {
      console.error('Error fetching trend data:', error);
      res.status(500).json({ error: 'Failed to fetch trend data' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

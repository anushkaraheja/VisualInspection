import type { NextApiRequest, NextApiResponse } from 'next';
import {
  ReportType,
  ReportFormat,
  PrismaClient,
  Report,
  Team,
  Prisma,
} from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// Define typed responses
interface ReportsResponse {
  reports?: (Report & { downloads: number })[];
  report?: Report;
  message?: string;
  error?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReportsResponse>
) {
  const session = await getSession(req, res);

  if (!session?.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { slug } = req.query;

  if (!slug || Array.isArray(slug)) {
    return res.status(400).json({ message: 'Invalid team slug' });
  }

  // Find team and verify membership
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!team || team.members.length === 0) {
    return res
      .status(404)
      .json({ message: 'Team not found or you are not a member' });
  }

  // Handle GET request - fetch reports
  if (req.method === 'GET') {
    try {
      const { filter, startDate, endDate, type } = req.query;

      // Build query filters
      const dateFilter =
        startDate && endDate
          ? {
              generatedOn: {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate)),
              },
            }
          : {};

      const typeFilter = type
        ? {
            type: type as ReportType,
          }
        : {};

      // Enforce team filter to ensure users only see their team's reports
      const reports: (Report & { _count: { downloads: number } })[] =
        await prisma.report.findMany({
          where: {
            teamId: team.id, // Explicit filter to ensure only team's reports are returned
            ...dateFilter,
            ...typeFilter,
            ...(filter
              ? {
                  OR: [
                    {
                      title: { contains: String(filter), mode: 'insensitive' },
                    },
                    {
                      description: {
                        contains: String(filter),
                        mode: 'insensitive',
                      },
                    },
                  ],
                }
              : {}),
          },
          include: {
            _count: {
              select: { downloads: true },
            },
          },
          orderBy: { generatedOn: 'desc' },
        });

      return res.status(200).json({
        reports: reports.map((report) => ({
          ...report,
          downloads: report._count.downloads,
        })),
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res
        .status(500)
        .json({ message: 'Failed to fetch reports', error });
    }
  }

  // Handle POST request - create new report
  if (req.method === 'POST') {
    try {
      const { title, description, type, formats } = req.body as {
        title: string;
        description?: string;
        type?: ReportType;
        formats?: ReportFormat[];
      };

      if (!title) {
        return res.status(400).json({ message: 'Report title is required' });
      }

      // Create the report explicitly with the team ID
      const report: Report = await prisma.report.create({
        data: {
          title,
          description,
          teamId: team.id, // Always use the verified team ID
          type: type || 'COMPLIANCE_SUMMARY',
          formats: formats || ['PDF'],
        },
      });

      return res.status(201).json({ report });
    } catch (error) {
      console.error('Error creating report:', error);
      return res
        .status(500)
        .json({ message: 'Failed to create report', error });
    }
  }

  // Return 405 for unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
}

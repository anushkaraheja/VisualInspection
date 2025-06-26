import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Severity } from '@prisma/client';
import { throwIfNoTeamAccess } from 'models/team';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { slug, id } = req.query;
    const { statusId, severity, comment } = req.body;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ message: 'Team slug is required' });
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Alert ID is required' });
    }

    if (!statusId || typeof statusId !== 'string') {
      return res.status(400).json({ message: 'Status ID is required' });
    }

    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    // Check if user has access to the team
    await throwIfNoTeamAccess(req, res);
    const session = await getSession(req, res);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify the compliance record exists and belongs to the team
    const compliance = await prisma.pPECompliance.findUnique({
      where: { id },
      include: {
        filterDevice: true,
        complianceStatus: true,
      },
    });

    if (!compliance) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Verify the compliance status exists and belongs to the team
    const status = await prisma.teamComplianceStatus.findUnique({
      where: { id: statusId },
      include: {
        team: {
          select: { slug: true },
        },
      },
    });

    if (!status || status.team.slug !== slug) {
      return res.status(404).json({ message: 'Status not found or not associated with this team' });
    }

    // Prepare comments data
    // Parse existing comments or initialize as empty array if null
    const existingComments = compliance.comments ? 
      (Array.isArray(compliance.comments) ? compliance.comments : [compliance.comments]) : [];
    
    // Create new comment entry
    const newComment = {
      text: comment.trim(),
      timestamp: new Date().toISOString(),
      user: session.user?.name || session.user?.email || 'Unknown User',
      statusFrom: compliance.statusId || 'null',
      statusTo: statusId,
    };

    // Prepare update data
    const updateData: any = { 
      statusId,
      comments: [...existingComments, newComment]
    };
    
    // Add severity if provided and valid
    if (severity && Object.values(Severity).includes(severity as Severity)) {
      updateData.severity = severity;
    }

    // Update the compliance record with the new status, comments, and optional severity
    const updatedCompliance = await prisma.pPECompliance.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Alert status updated successfully',
      data: updatedCompliance
    });
    
  } catch (error) {
    console.error('Error updating alert status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

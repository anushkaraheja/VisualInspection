import { EventType, TeamMember, PrismaClient } from '@prisma/client';
import { eventTypes } from './common';

const prisma = new PrismaClient();

interface WebhookProps {
  url: string;
  description: string;
  eventTypes: string[];
  teamMember: TeamMember;
}

// Map between user-friendly event type strings and actual EventType enum values
export const eventTypeMapping: Record<string, EventType> = {
  'member.created': EventType.member_created,
  'member.removed': EventType.member_removed,
  'invitation.created': EventType.invitation_created,
  'invitation.removed': EventType.inviation_removed,
  'alerts.created': EventType.alerts_created,
};

// Helper function to validate and convert event types
const validateAndConvertEventTypes = (types: string[]): EventType[] => {
  const validatedTypes = types
    .filter((type) => eventTypes.includes(type))
    .map((type) => eventTypeMapping[type])
    .filter(Boolean);

  if (validatedTypes.length !== types.length) {
    console.warn('Some event types were invalid and have been filtered out');
  }

  return validatedTypes;
};

export const createWebhookDB = async (props: WebhookProps) => {
  const { url, description, eventTypes, teamMember } = props;

  try {
    // Convert string[] to EventType[]
    const validEventTypes = validateAndConvertEventTypes(eventTypes);

    if (validEventTypes.length === 0) {
      return { success: false, error: 'No valid event types provided' };
    }

    const webhook = await prisma.webhook.create({
      data: {
        url,
        description,
        eventTypes: validEventTypes,
        teamId: teamMember.teamId,
        teamMemberId: teamMember.id,
      },
    });

    return { success: true, data: webhook };
  } catch (error) {
    console.error('Error creating webhook:', error);
    return { success: false, error: 'Failed to create webhook' };
  }
};

export const getWebhooksDB = async (teamId: string) => {
  try {
    const data = await prisma.webhook.findMany({
      where: {
        teamId: teamId,
      },
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error creating webhook:', error);
    return { success: false, error: 'Failed to create webhook' };
  }
};

export const deleteWebhookDB = async (id: string) => {
  try {
    const webhook = await prisma.webhook.delete({
      where: {
        id: id,
      },
    });
    return { success: true, data: webhook };
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return { success: false, error: 'Failed to delete webhook' };
  }
};

export const getWebhookByIdDB = async (id: string, teamId: string) => {
  try {
    const webhook = await prisma.webhook.findFirst({
      where: {
        id,
        teamId,
      },
    });

    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    return { success: true, data: webhook };
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return { success: false, error: 'Failed to fetch webhook' };
  }
};

export const updateWebhookDB = async (id: string, teamId: string, data: { 
  url?: string;
  description?: string;
  eventTypes?: string[];
  teamMemberId?: string;
}) => {
  try {
    // Check if webhook exists
    const existingWebhook = await prisma.webhook.findFirst({
      where: {
        id,
        teamId,
      },
    });

    if (!existingWebhook) {
      return { success: false, error: 'Webhook not found' };
    }

    // Convert string[] to EventType[] if eventTypes are provided
    let validEventTypes;
    if (data.eventTypes && data.eventTypes.length > 0) {
      validEventTypes = validateAndConvertEventTypes(data.eventTypes);
      
      if (validEventTypes.length === 0) {
        return { success: false, error: 'No valid event types provided' };
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.url) updateData.url = data.url;
    if (data.description) updateData.description = data.description;
    if (validEventTypes) updateData.eventTypes = validEventTypes;
    if (data.teamMemberId) updateData.teamMemberId = data.teamMemberId;

    // Update webhook
    const updatedWebhook = await prisma.webhook.update({
      where: {
        id,
      },
      data: updateData,
    });

    return { success: true, data: updatedWebhook };
  } catch (error) {
    console.error('Error updating webhook:', error);
    return { success: false, error: 'Failed to update webhook' };
  }
};
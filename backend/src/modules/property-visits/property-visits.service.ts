import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { NotificationType, UserRole, VisitStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { MailService } from '../../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';

import { serializePrisma } from '../../common/utils/prisma-response.util';

import { CreatePropertyVisitDto } from './dto/create-property-visit.dto';
import { UpdatePropertyVisitDto } from './dto/update-property-visit.dto';

@Injectable()
export class PropertyVisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  // ============================================================
  // Create Visit Request
  // ============================================================

  async create(dto: CreatePropertyVisitDto, user: any) {
    const property = await this.prisma.property.findUnique({
      where: {
        id: dto.propertyId,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (!property.isAvailable) {
      throw new BadRequestException(
        'This property is not available for visits.',
      );
    }

    // Prevent owner from booking a visit on their own property.
    if (property.ownerId === user.id) {
      throw new BadRequestException(
        'You cannot book a visit for your own property.',
      );
    }

    const visitDate = new Date(dto.visitDate);

    if (Number.isNaN(visitDate.getTime())) {
      throw new BadRequestException('Invalid visit date.');
    }

    if (visitDate.getTime() <= Date.now()) {
      throw new BadRequestException('Visit date must be in the future.');
    }

    // Prevent duplicate active bookings for the same property/time.
    const existingVisit = await this.prisma.propertyVisit.findFirst({
      where: {
        propertyId: dto.propertyId,
        visitDate,
        status: {
          in: [VisitStatus.PENDING, VisitStatus.APPROVED],
        },
      },
    });

    if (existingVisit) {
      throw new BadRequestException('This time slot is already booked.');
    }

    const visit = await this.prisma.propertyVisit.create({
      data: {
        propertyId: dto.propertyId,
        tenantId: user.id,
        visitDate,
        notes: dto.notes,
      },

      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },

            images: {
              where: {
                isPrimary: true,
              },
              orderBy: {
                displayOrder: 'asc',
              },
            },
          },
        },

        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // ============================================================
    // Email Notification
    // ============================================================

    /*
    await this.mailService.sendVisitRequestEmail(
      visit.property.owner.email,
      {
        ownerName: visit.property.owner.fullName,
        tenantName: visit.tenant.fullName,
        propertyTitle: visit.property.title,
        visitDate: visit.visitDate,
      },
    );
    */

    // ============================================================
    // In-App Notification
    // ============================================================

    await this.notificationsService.createNotification(
      visit.property.owner.id,
      'New Visit Request',
      `${visit.tenant.fullName} requested a property visit.`,
      NotificationType.VISIT_REQUEST,
    );

    // ============================================================
    // Push Notification
    // ============================================================

    await this.pushNotificationsService.sendToUser(
      visit.property.owner.id,
      'New Visit Request',
      `${visit.tenant.fullName} requested a property visit for "${visit.property.title}".`,
      {
        type: 'VISIT_REQUEST',
        propertyId: visit.property.id,
        visitId: visit.id,
      },
    );

    return {
      success: true,
      message: 'Visit booked successfully.',
      data: serializePrisma(visit),
    };
  }

  // ============================================================
  // Get Visits
  //
  // Tenant:
  //   only own visits
  //
  // Admin:
  //   all visits
  //
  // Owner:
  //   returns own tenant visits if they happen to have any;
  //   owner-specific requests use /owner.
  // ============================================================

  async findAll(user: any) {
    const where =
      user.role === UserRole.ADMIN
        ? {}
        : {
            tenantId: user.id,
          };

    const visits = await this.prisma.propertyVisit.findMany({
      where,

      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },

            images: {
              where: {
                isPrimary: true,
              },
              orderBy: {
                displayOrder: 'asc',
              },
            },
          },
        },

        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },

      orderBy: {
        visitDate: 'asc',
      },
    });

    return {
      success: true,
      total: visits.length,
      visits: serializePrisma(visits),
    };
  }

  // ============================================================
  // Owner Visits
  // ============================================================

  async getOwnerVisits(user: any) {
    const visits = await this.prisma.propertyVisit.findMany({
      where: {
        property: {
          ownerId: user.id,
        },
      },

      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },

            images: {
              where: {
                isPrimary: true,
              },
              orderBy: {
                displayOrder: 'asc',
              },
            },
          },
        },

        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },

      orderBy: {
        visitDate: 'asc',
      },
    });

    return {
      success: true,
      total: visits.length,
      visits: serializePrisma(visits),
    };
  }

  // ============================================================
  // Find One - Authorized
  // ============================================================

  async findOne(id: string, user: any) {
    const visit = await this.prisma.propertyVisit.findUnique({
      where: {
        id,
      },

      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },

            images: {
              where: {
                isPrimary: true,
              },
              orderBy: {
                displayOrder: 'asc',
              },
            },
          },
        },

        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    const isAdmin = user.role === UserRole.ADMIN;

    const isTenant = visit.tenantId === user.id;

    const isOwner = visit.property.ownerId === user.id;

    if (!isAdmin && !isTenant && !isOwner) {
      throw new ForbiddenException('Access denied.');
    }

    return serializePrisma(visit);
  }

  // ============================================================
  // Approve
  // ============================================================

  async approveVisit(id: string, user: any) {
    const visit = await this.getAuthorizedVisitForOwnerAction(id, user);

    if (visit.status !== VisitStatus.PENDING) {
      throw new BadRequestException(
        `Only pending visits can be approved. Current status: ${visit.status}.`,
      );
    }

    const updatedVisit = await this.prisma.propertyVisit.update({
      where: {
        id,
      },

      data: {
        status: VisitStatus.APPROVED,
      },

      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },

            images: {
              where: {
                isPrimary: true,
              },
            },
          },
        },

        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // ============================================================
    // Email
    // ============================================================

    void this.mailService
      .sendVisitApprovalEmail(
        updatedVisit.tenant.email,
        updatedVisit.tenant.fullName,
        updatedVisit.property.title,
        updatedVisit.visitDate.toLocaleString(),
      )
      .catch((error) => {
        console.error('Visit approval email failed:', error);
      });

    // ============================================================
    // In-App Notification — non-blocking
    // ============================================================

    void this.notificationsService
      .createNotification(
        updatedVisit.tenant.id,
        'Visit Approved',
        'Your property visit has been approved.',
        NotificationType.VISIT_APPROVED,
      )
      .catch((error) => {
        console.error('Visit approval notification failed:', error);
      });

    // ============================================================
    // Push Notification — non-blocking
    // ============================================================

    void this.pushNotificationsService
      .sendToUser(
        updatedVisit.tenant.id,
        'Visit Approved',
        `Your visit for "${updatedVisit.property.title}" has been approved.`,
        {
          type: 'VISIT_APPROVED',
          propertyId: updatedVisit.property.id,
          visitId: updatedVisit.id,
        },
      )
      .catch((error) => {
        console.error('Visit approval push notification failed:', error);
      });

    return {
      success: true,
      message: 'Visit approved successfully.',
      data: serializePrisma(updatedVisit),
    };
  }
  // ============================================================
  // Reject
  // ============================================================

  async rejectVisit(id: string, user: any) {
    const visit = await this.getAuthorizedVisitForOwnerAction(id, user);

    if (visit.status !== VisitStatus.PENDING) {
      throw new BadRequestException(
        `Only pending visits can be rejected. Current status: ${visit.status}.`,
      );
    }

    const updatedVisit = await this.prisma.propertyVisit.update({
      where: {
        id,
      },

      data: {
        status: VisitStatus.REJECTED,
      },

      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },

            images: {
              where: {
                isPrimary: true,
              },
            },
          },
        },

        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // ============================================================
    // Email
    // ============================================================

    try {
      await this.mailService.sendVisitRejectedEmail(
        updatedVisit.tenant.email,
        updatedVisit.tenant.fullName,
        updatedVisit.property.title,
      );
    } catch (error) {
      console.error('Visit rejection email failed:', error);
    }

    // ============================================================
    // In-App Notification
    // ============================================================

    await this.notificationsService.createNotification(
      updatedVisit.tenant.id,
      'Visit Rejected',
      `Your visit for "${updatedVisit.property.title}" has been rejected.`,
      NotificationType.VISIT_REJECTED,
    );

    // ============================================================
    // Push
    // ============================================================

    await this.pushNotificationsService.sendToUser(
      updatedVisit.tenant.id,
      'Visit Rejected',
      `Your visit for "${updatedVisit.property.title}" has been rejected.`,
      {
        type: 'VISIT_REJECTED',
        propertyId: updatedVisit.property.id,
        visitId: updatedVisit.id,
      },
    );

    return {
      success: true,
      message: 'Visit rejected successfully.',
      data: serializePrisma(updatedVisit),
    };
  }

  // ============================================================
  // Complete
  // ============================================================

  async completeVisit(id: string, user: any) {
    const visit = await this.getAuthorizedVisitForOwnerAction(id, user);

    if (visit.status !== VisitStatus.APPROVED) {
      throw new BadRequestException(
        `Only approved visits can be completed. Current status: ${visit.status}.`,
      );
    }

    const updatedVisit = await this.prisma.propertyVisit.update({
      where: {
        id,
      },

      data: {
        status: VisitStatus.COMPLETED,
      },

      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },

            images: {
              where: {
                isPrimary: true,
              },
            },
          },
        },

        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // ============================================================
    // DEBUG: Email
    // ============================================================

    console.log('⏱️ COMPLETE: starting email');

    try {
      await this.mailService.sendVisitCompletedEmail(
        updatedVisit.tenant.email,
        updatedVisit.tenant.fullName,
        updatedVisit.property.title,
      );

      console.log('✅ COMPLETE: email finished');
    } catch (error) {
      console.error('❌ COMPLETE: email failed:', error);
    }

    // ============================================================
    // DEBUG: In-App Notification
    // ============================================================

    console.log('⏱️ COMPLETE: starting in-app notification');

    await this.notificationsService.createNotification(
      updatedVisit.tenant.id,
      'Visit Completed',
      `Your visit for "${updatedVisit.property.title}" has been marked as completed.`,
      NotificationType.VISIT_COMPLETED,
    );

    console.log('✅ COMPLETE: in-app notification finished');

    // ============================================================
    // DEBUG: Push
    // ============================================================

    console.log('⏱️ COMPLETE: starting push');

    await this.pushNotificationsService.sendToUser(
      updatedVisit.tenant.id,
      'Visit Completed',
      `Your visit for "${updatedVisit.property.title}" has been completed.`,
      {
        type: 'VISIT_COMPLETED',
        propertyId: updatedVisit.property.id,
        visitId: updatedVisit.id,
      },
    );

    console.log('✅ COMPLETE: push finished');

    console.log('🏁 COMPLETE: returning response');

    return {
      success: true,
      message: 'Visit completed successfully.',
      data: serializePrisma(updatedVisit),
    };
  }

  // ============================================================
  // Cancel
  // ============================================================

  async cancelVisit(id: string, user: any) {
    const visit = await this.getAuthorizedVisit(id, user);

    if (
      visit.status === VisitStatus.COMPLETED ||
      visit.status === VisitStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `A ${visit.status.toLowerCase()} visit cannot be cancelled.`,
      );
    }

    const isTenant = visit.tenantId === user.id;

    const updatedVisit = await this.prisma.propertyVisit.update({
      where: {
        id,
      },

      data: {
        status: VisitStatus.CANCELLED,
      },

      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },

            images: {
              where: {
                isPrimary: true,
              },
            },
          },
        },

        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // ============================================================
    // Email
    // ============================================================

    try {
      if (isTenant) {
        await this.mailService.sendVisitCancelledEmail(
          updatedVisit.property.owner.email,
          updatedVisit.property.owner.fullName,
          updatedVisit.property.title,
        );
      } else {
        await this.mailService.sendVisitCancelledEmail(
          updatedVisit.tenant.email,
          updatedVisit.tenant.fullName,
          updatedVisit.property.title,
        );
      }
    } catch (error) {
      console.error('Visit cancellation email failed:', error);
    }

    // ============================================================
    // Notification receiver
    // ============================================================

    const receiverId = isTenant
      ? updatedVisit.property.owner.id
      : updatedVisit.tenant.id;

    const title = 'Visit Cancelled';

    const message = isTenant
      ? `${updatedVisit.tenant.fullName} cancelled the visit for "${updatedVisit.property.title}".`
      : `Your visit for "${updatedVisit.property.title}" has been cancelled.`;

    await this.notificationsService.createNotification(
      receiverId,
      title,
      message,
      NotificationType.VISIT_CANCELLED,
    );

    // ============================================================
    // Push
    // ============================================================

    await this.pushNotificationsService.sendToUser(receiverId, title, message, {
      type: 'VISIT_CANCELLED',
      propertyId: updatedVisit.property.id,
      visitId: updatedVisit.id,
    });

    return {
      success: true,
      message: 'Visit cancelled successfully.',
      data: serializePrisma(updatedVisit),
    };
  }

  // ============================================================
  // Update
  // ============================================================

  async update(id: string, dto: UpdatePropertyVisitDto, user: any) {
    const visit = await this.getAuthorizedVisit(id, user);

    if (visit.status !== VisitStatus.PENDING) {
      throw new BadRequestException('Only pending visits can be updated.');
    }

    // Only tenant, owner or admin can update.
    // Property ownership is already checked by
    // getAuthorizedVisit().

    const updatedVisit = await this.prisma.propertyVisit.update({
      where: {
        id,
      },

      data: {
        ...(dto.visitDate && {
          visitDate: new Date(dto.visitDate),
        }),

        ...(dto.notes !== undefined && {
          notes: dto.notes,
        }),
      },

      include: {
        property: true,

        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Visit updated successfully.',
      data: serializePrisma(updatedVisit),
    };
  }

  // ============================================================
  // Delete
  // ============================================================

  async remove(id: string, user: any) {
    await this.getAuthorizedVisit(id, user);

    await this.prisma.propertyVisit.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Visit deleted successfully.',
    };
  }

  // ============================================================
  // Authorization Helpers
  // ============================================================

  private async getAuthorizedVisit(id: string, user: any) {
    const visit = await this.prisma.propertyVisit.findUnique({
      where: {
        id,
      },

      include: {
        property: {
          select: {
            id: true,
            ownerId: true,
            title: true,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    const isAdmin = user.role === UserRole.ADMIN;

    const isTenant = visit.tenantId === user.id;

    const isOwner = visit.property.ownerId === user.id;

    if (!isAdmin && !isTenant && !isOwner) {
      throw new ForbiddenException('Access denied.');
    }

    return visit;
  }

  // ============================================================
  // Owner/Admin Authorization
  // ============================================================

  private async getAuthorizedVisitForOwnerAction(id: string, user: any) {
    const visit = await this.prisma.propertyVisit.findUnique({
      where: {
        id,
      },

      include: {
        property: {
          select: {
            id: true,
            ownerId: true,
            title: true,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }

    const isAdmin = user.role === UserRole.ADMIN;

    const isOwner = visit.property.ownerId === user.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'Only the property owner or administrator can perform this action.',
      );
    }

    return visit;
  }
}

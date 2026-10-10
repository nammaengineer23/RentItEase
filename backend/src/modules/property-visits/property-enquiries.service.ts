import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PropertyEnquiryStatus, PropertyTransactionType, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';
import { CreatePropertyEnquiryDto, UpdatePropertyEnquiryStatusDto } from './dto/property-enquiry.dto';

@Injectable()
export class PropertyEnquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  private marketplaceEnabled(): boolean {
    return process.env.PROPERTY_MARKETPLACE_ENABLED === 'true';
  }

  async create(dto: CreatePropertyEnquiryDto, user: any) {
    if (!this.marketplaceEnabled()) {
      throw new BadRequestException('Property sales and lease enquiries are not enabled yet.');
    }
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      select: { id: true, ownerId: true, transactionType: true, isVerified: true, isAvailable: true },
    });
    if (!property || !property.isVerified || !property.isAvailable ||
        property.transactionType === PropertyTransactionType.RENT) {
      throw new NotFoundException('Eligible sale, site-sale, or lease listing not found.');
    }
    if (property.ownerId === user.id) {
      throw new BadRequestException('You cannot enquire about your own listing.');
    }
    const message = dto.message.trim();
    if (message.length < 5) throw new BadRequestException('Enquiry message must contain at least 5 characters.');

    const enquiry = await this.prisma.propertyEnquiry.create({
      data: { propertyId: property.id, senderId: user.id, message },
      select: {
        id: true, propertyId: true, senderId: true, message: true, status: true, createdAt: true,
      },
    });
    return { success: true, enquiry: serializePrisma(enquiry) };
  }

  async findMine(user: any) {
    return serializePrisma(await this.prisma.propertyEnquiry.findMany({
      where: { senderId: user.id },
      select: {
        id: true, propertyId: true, message: true, status: true, createdAt: true, updatedAt: true,
        property: { select: { id: true, title: true, city: true, transactionType: true, askingPrice: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }));
  }

  async findForOwner(user: any) {
    return serializePrisma(await this.prisma.propertyEnquiry.findMany({
      where: { property: { ownerId: user.id } },
      select: {
        id: true, propertyId: true, senderId: true, message: true, status: true, createdAt: true, updatedAt: true,
        property: { select: { id: true, title: true, city: true, transactionType: true } },
        sender: { select: { id: true, fullName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    }));
  }

  async updateStatus(id: string, dto: UpdatePropertyEnquiryStatusDto, user: any) {
    if (!Object.values(PropertyEnquiryStatus).includes(dto.status as PropertyEnquiryStatus)) {
      throw new BadRequestException('Invalid enquiry status.');
    }
    const existing = await this.prisma.propertyEnquiry.findUnique({
      where: { id },
      select: { id: true, status: true, property: { select: { ownerId: true } } },
    });
    if (!existing) throw new NotFoundException('Property enquiry not found.');
    if (user.role !== UserRole.ADMIN && existing.property.ownerId !== user.id) {
      throw new ForbiddenException('Only the listing owner or an administrator can update this enquiry.');
    }
    const updated = await this.prisma.propertyEnquiry.update({
      where: { id },
      data: { status: dto.status as PropertyEnquiryStatus },
      select: { id: true, propertyId: true, senderId: true, message: true, status: true, updatedAt: true },
    });
    return { success: true, enquiry: serializePrisma(updated) };
  }
}

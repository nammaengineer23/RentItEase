import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateInvoiceNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `RIE-${timestamp}-${random}`;
  }

  async create(dto: CreateInvoiceDto, user: { id: string; role: UserRole }) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can create invoices.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (dto.paymentId) {
      const payment = await this.prisma.payment.findUnique({
        where: { id: dto.paymentId },
        include: { booking: true },
      });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.booking.tenantId !== dto.userId) {
        throw new BadRequestException('Invoice user does not match the payment tenant.');
      }

      const existing = await this.prisma.invoice.findFirst({
        where: { paymentId: dto.paymentId },
      });
      if (existing) {
        throw new BadRequestException('An invoice already exists for this payment');
      }
    }

    const taxAmount = dto.taxAmount ?? 0;
    const amount = new Prisma.Decimal(dto.amount);
    const tax = new Prisma.Decimal(taxAmount);
    const totalAmount = amount.add(tax);

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: this.generateInvoiceNumber(),
        userId: dto.userId,
        paymentId: dto.paymentId,
        amount,
        taxAmount: tax,
        totalAmount,
        currency: dto.currency ?? 'INR',
        status: InvoiceStatus.GENERATED,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return serializePrisma(invoice);
  }

  async findAllByUser(userId: string, user: { id: string; role: string }) {
    if (user.role !== UserRole.ADMIN && user.id !== userId) {
      throw new ForbiddenException('You do not have access to these invoices.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!targetUser) throw new NotFoundException('User not found');

    const invoices = await this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { invoiceDate: 'desc' },
    });

    return serializePrisma(invoices);
  }

  private async findInvoiceWithAccess(id: string, user: { id: string; role: string }) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        payment: {
          include: {
            booking: {
              include: { property: true },
            },
          },
        },
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const booking = invoice.payment?.booking;
    const allowed =
      user.role === UserRole.ADMIN ||
      invoice.userId === user.id ||
      booking?.property?.ownerId === user.id;

    if (!allowed) throw new ForbiddenException('Invoice access denied');
    return invoice;
  }

  async findOne(id: string, user: { id: string; role: string }) {
    return serializePrisma(await this.findInvoiceWithAccess(id, user));
  }

  async findByInvoiceNumber(
    invoiceNumber: string,
    user: { id: string; role: string },
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        payment: {
          include: {
            booking: {
              include: { property: true },
            },
          },
        },
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const booking = invoice.payment?.booking;
    const allowed =
      user.role === UserRole.ADMIN ||
      invoice.userId === user.id ||
      booking?.property?.ownerId === user.id;

    if (!allowed) throw new ForbiddenException('Invoice access denied');
    return serializePrisma(invoice);
  }

  async findByPayment(
    paymentId: string,
    user: { id: string; role: string },
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { paymentId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        payment: {
          include: {
            booking: {
              include: { property: true },
            },
          },
        },
      },
    });

    return serializePrisma(this.ensureInvoiceAccess(invoice, user));
  }

  async findByBooking(
    bookingId: string,
    user: { id: string; role: string },
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        payment: { bookingId, status: 'SUCCESS' },
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        payment: {
          include: {
            booking: { include: { property: true } },
          },
        },
      },
    });

    return serializePrisma(this.ensureInvoiceAccess(invoice, user));
  }

  async findByMembership(
    membershipId: string,
    user: { id: string; role: string },
  ) {
    let invoice = await this.prisma.invoice.findFirst({
      where: { membershipId, status: InvoiceStatus.PAID },
      include: { membership: { include: { plan: true } } },
    });

    if (!invoice) {
      const membership = await this.prisma.membership.findUnique({
        where: { id: membershipId },
        include: { plan: true },
      });
      if (!membership) throw new NotFoundException('Premium membership not found');
      if (user.role !== UserRole.ADMIN && membership.userId !== user.id) {
        throw new ForbiddenException('Invoice access denied');
      }

      const amount = membership.amount ?? new Prisma.Decimal(0);
      invoice = await this.prisma.invoice.upsert({
        where: { invoiceNumber: `RIE-PREM-${membership.id}` },
        update: { membershipId: membership.id },
        create: {
          invoiceNumber: `RIE-PREM-${membership.id}`,
          userId: membership.userId,
          membershipId: membership.id,
          amount,
          taxAmount: new Prisma.Decimal(0),
          totalAmount: amount,
          currency: 'INR',
          status: InvoiceStatus.PAID,
          description: membership.isTrial
            ? 'Complimentary 30-day RentItEase Premium trial'
            : 'RentItEase Premium membership - 30 days',
        },
        include: { membership: { include: { plan: true } } },
      });
    }

    if (user.role !== UserRole.ADMIN && invoice.userId !== user.id) {
      throw new ForbiddenException('Invoice access denied');
    }
    return serializePrisma(invoice);
  }

  private ensureInvoiceAccess(
    invoice: any,
    user: { id: string; role: string },
  ) {
    if (!invoice) throw new NotFoundException('Completed invoice not found');
    const booking = invoice.payment?.booking;
    const allowed =
      user.role === UserRole.ADMIN ||
      invoice.userId === user.id ||
      booking?.property?.ownerId === user.id;
    if (!allowed) throw new ForbiddenException('Invoice access denied');
    return invoice;
  }

  async markPaid(id: string, user: { id: string; role: UserRole }) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can mark invoices paid.');
    }

    await this.prisma.invoice.findUniqueOrThrow({ where: { id } });
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PAID },
    });
    return serializePrisma(invoice);
  }

  async cancel(id: string, user: { id: string; role: UserRole }) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can cancel invoices.');
    }

    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Invoice is already cancelled');
    }

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
    });
    return serializePrisma(updatedInvoice);
  }
}

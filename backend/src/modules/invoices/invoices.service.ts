import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InvoiceStatus, Prisma } from '@prisma/client';
  
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
  
    async create(dto: CreateInvoiceDto) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
  
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      if (dto.paymentId) {
        const existing = await this.prisma.invoice.findFirst({
          where: {
            paymentId: dto.paymentId,
          },
        });
  
        if (existing) {
          throw new BadRequestException(
            'An invoice already exists for this payment',
          );
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
          dueDate: dto.dueDate
            ? new Date(dto.dueDate)
            : undefined,
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
  
    async findAllByUser(userId: string) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
  
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      const invoices = await this.prisma.invoice.findMany({
        where: { userId },
        orderBy: {
          invoiceDate: 'desc',
        },
      });

      return serializePrisma(invoices);
    }
  
    async findOne(id: string) {
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
        },
      });
  
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
  
      return serializePrisma(invoice);
    }
  
    async findByInvoiceNumber(invoiceNumber: string) {
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
        },
      });
  
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
  
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
      const invoice = await this.prisma.invoice.findFirst({
        where: { membershipId, status: InvoiceStatus.PAID },
        include: { membership: { include: { plan: true } } },
      });
      if (!invoice) throw new NotFoundException('Premium invoice not found');
      if (user.role !== 'ADMIN' && invoice.userId !== user.id) {
        throw new BadRequestException('Invoice access denied');
      }
      return serializePrisma(invoice);
    }

    private ensureInvoiceAccess(
      invoice: any,
      user: { id: string; role: string },
    ) {
      if (!invoice) throw new NotFoundException('Completed invoice not found');
      const booking = invoice.payment?.booking;
      const allowed = user.role === 'ADMIN' ||
        invoice.userId === user.id ||
        booking?.property?.ownerId === user.id;
      if (!allowed) throw new BadRequestException('Invoice access denied');
      return invoice;
    }
  
    async markPaid(id: string) {
      await this.findOne(id);
  
      const invoice = await this.prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.PAID,
        },
      });
      return serializePrisma(invoice);
    }
  
    async cancel(id: string) {
      const invoice = await this.findOne(id);
  
      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new BadRequestException(
          'Invoice is already cancelled',
        );
      }
  
      const updatedInvoice = await this.prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.CANCELLED,
        },
      });
      return serializePrisma(updatedInvoice);
    }
  }

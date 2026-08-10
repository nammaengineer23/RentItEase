import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InvoiceStatus, Prisma } from '@prisma/client';
  
  import { PrismaService } from '../../database/prisma.service';
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
  
      return this.prisma.invoice.create({
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
    }
  
    async findAllByUser(userId: string) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
  
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      return this.prisma.invoice.findMany({
        where: { userId },
        orderBy: {
          invoiceDate: 'desc',
        },
      });
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
  
      return invoice;
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
  
      return invoice;
    }
  
    async findByPayment(paymentId: string) {
      return this.prisma.invoice.findFirst({
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
        },
      });
    }
  
    async markPaid(id: string) {
      await this.findOne(id);
  
      return this.prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.PAID,
        },
      });
    }
  
    async cancel(id: string) {
      const invoice = await this.findOne(id);
  
      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new BadRequestException(
          'Invoice is already cancelled',
        );
      }
  
      return this.prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.CANCELLED,
        },
      });
    }
  }
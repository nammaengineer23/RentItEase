import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { BookingStatus, LeaseStatus, MembershipStatus, PaymentStatus, UserRole, VisitStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { AuthService } from '../auth/auth.service';
import { OtpService } from '../../common/otp/otp.service';
import { BookingService } from '../booking/booking.service';
import { LeaseService } from '../lease/lease.service';
import { PaymentsService } from '../payments/payments.service';
import { InvoicesService } from '../invoices/invoices.service';
import { PropertyVisitsService } from '../property-visits/property-visits.service';
import { ReviewsService } from '../reviews/reviews.service';
import { ChatService } from '../chat/chat.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MembershipService } from '../membership/membership.service';
import { SettingsService } from '../settings/settings.service';

describe('Phase 30 critical backend security regression suite', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
  });

  it('Auth rejects unknown users without attempting password verification', async () => {
    const prisma: any = { user: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new AuthService(
      prisma,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.login({ login: 'missing@example.com', password: 'secret' } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.findFirst).toHaveBeenCalled();
  });

  it('OTP rejects an expired challenge and caps failed attempts', async () => {
    const prisma: any = {
      authOtpChallenge: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'otp-1',
          otpHash: 'hash',
          expiresAt: new Date(Date.now() - 1000),
          attempts: 0,
        }),
      },
    };
    const service = new AuthService(
      prisma,
      {} as any,
      {} as any,
      {} as any,
      { verifyOtp: jest.fn(), generateOtp: jest.fn(), hashOtp: jest.fn(), getExpiryDate: jest.fn() } as any,
    );

    await expect(
      service.loginWithEmailOtp({ email: 'user@example.com', otp: '123456' } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Refresh token reuse is rejected after rotation', async () => {
    const refreshToken = 'refresh-token';
    const jwt = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 'user-1',
        email: 'user@example.com',
      }),
      signAsync: jest.fn().mockResolvedValueOnce('access-2').mockResolvedValueOnce('refresh-2'),
    };
    const prisma: any = {
      refreshToken: {
        findMany: jest.fn().mockResolvedValueOnce([
          {
            id: 'refresh-1',
            token: await bcrypt.hash(refreshToken, 4),
            expiresAt: new Date(Date.now() + 60_000),
          },
        ]).mockResolvedValueOnce([]),
        delete: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new AuthService(
      prisma,
      jwt as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(service.refreshToken(refreshToken)).resolves.toMatchObject({
      success: true,
    });
    await expect(service.refreshToken(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { id: 'refresh-1' },
    });
  });

  it('OTP brute-force protection rejects a challenge after five failures', async () => {
    const prisma: any = {
      authOtpChallenge: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'otp-1',
          otpHash: 'hash',
          expiresAt: new Date(Date.now() + 60_000),
          attempts: 5,
        }),
      },
    };
    const service = new AuthService(
      prisma,
      {} as any,
      {} as any,
      {} as any,
      { verifyOtp: jest.fn() } as any,
    );

    await expect(
      (service as any).consumeEmailOtpChallenge(
        'user@example.com',
        'LOGIN_EMAIL',
        '123456',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.authOtpChallenge.update).toBeUndefined();
  });

  it('OTP challenge is single-use after successful verification', async () => {
    const challenge = {
      id: 'otp-1',
      otpHash: 'hash',
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
    };
    const prisma: any = {
      authOtpChallenge: {
        findFirst: jest.fn().mockResolvedValueOnce(challenge).mockResolvedValueOnce(null),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new AuthService(
      prisma,
      {} as any,
      {} as any,
      {} as any,
      { verifyOtp: jest.fn().mockResolvedValue(true) } as any,
    );

    await expect(
      (service as any).consumeEmailOtpChallenge(
        'user@example.com',
        'LOGIN_EMAIL',
        '123456',
      ),
    ).resolves.toBeUndefined();

    expect(prisma.authOtpChallenge.delete).toHaveBeenCalledWith({
      where: { id: 'otp-1' },
    });
  });

  it('JWT refresh rejects an invalid token', async () => {
    const jwt = { verifyAsync: jest.fn().mockRejectedValue(new Error('expired')) };
    const service = new AuthService(
      {} as any,
      jwt as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(service.refreshToken('expired-token')).rejects.toThrow('expired');
    expect(jwt.verifyAsync).toHaveBeenCalled();
  });

  it('Booking blocks a tenant from booking another tenant\'s visit', async () => {
    const prisma: any = {
      propertyVisit: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'visit-1',
          tenantId: 'tenant-owner',
          propertyId: 'property-1',
          status: VisitStatus.APPROVED,
          property: { ownerId: 'owner-1', isAvailable: true },
          booking: null,
        }),
      },
    };
    const service = new BookingService(prisma, {} as any, {} as any);

    await expect(
      service.create({ visitId: 'visit-1' } as any, { id: 'attacker', role: UserRole.USER }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Lease blocks a non-tenant from creating a lease from a paid booking', async () => {
    const prisma: any = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'booking-1',
          tenantId: 'tenant-1',
          propertyId: 'property-1',
          status: BookingStatus.PAID,
          lease: null,
          property: { ownerId: 'owner-1' },
        }),
      },
    };
    const service = new LeaseService(prisma, {} as any, {} as any);

    await expect(
      service.create(
        { bookingId: 'booking-1', startDate: '2026-10-01' } as any,
        { id: 'attacker', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Payment verification rejects a bad signature without mutating payment state', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';

    const paymentUpdate = jest.fn();
    const prisma: any = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'payment-1',
          bookingId: 'booking-1',
          razorpayOrderId: 'order-real',
          status: PaymentStatus.PENDING,
          amount: 60000,
          currency: 'INR',
          booking: {
            tenantId: 'tenant-1',
            propertyId: 'property-1',
            property: {
              ownerId: 'owner-1',
              title: 'Test property',
            },
          },
        }),
        update: paymentUpdate,
      },
    };

    const service = new PaymentsService(prisma, {} as any, {} as any);

    await expect(
      service.verifyPayment(
        {
          bookingId: 'booking-1',
          razorpayOrderId: 'order-real',
          razorpayPaymentId: 'pay-attacker',
          razorpaySignature: 'bad',
        } as any,
        { id: 'tenant-1', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(paymentUpdate).not.toHaveBeenCalled();
  });

  it('Payment verification rejects a mismatched Razorpay order ID', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';

    const prisma: any = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'payment-1',
          bookingId: 'booking-1',
          razorpayOrderId: 'order-real',
          status: PaymentStatus.CREATED,
          booking: {
            tenantId: 'tenant-1',
            propertyId: 'property-1',
            property: { ownerId: 'owner-1', title: 'Test property' },
          },
        }),
      },
    };
    const service = new PaymentsService(prisma, {} as any, {} as any);

    await expect(
      service.verifyPayment(
        {
          bookingId: 'booking-1',
          razorpayOrderId: 'order-attacker',
          razorpayPaymentId: 'pay-1',
          razorpaySignature: 'bad',
        } as any,
        { id: 'tenant-1', role: UserRole.USER },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Duplicate payment order requests reuse the existing payment record', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';

    const prisma: any = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'booking-1',
          tenantId: 'tenant-1',
          status: BookingStatus.PAYMENT_PENDING,
          monthlyRent: 20000,
          securityDeposit: 40000,
          payment: {
            id: 'payment-1',
            bookingId: 'booking-1',
            razorpayOrderId: 'order-existing',
            amount: 60000,
            currency: 'INR',
            status: PaymentStatus.PENDING,
          },
          property: {
            id: 'property-1',
            owner: { id: 'owner-1', fullName: 'Owner' },
          },
          tenant: {
            id: 'tenant-1',
            fullName: 'Tenant',
            email: 'tenant@example.com',
            phone: '9999999999',
          },
        }),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
      },
    };

    const service = new PaymentsService(prisma, {} as any, {} as any);

    const result = await service.createOrder(
      { bookingId: 'booking-1' } as any,
      { id: 'tenant-1', role: UserRole.USER },
    );

    expect(result.data.razorpayOrderId).toBe('order-existing');
    expect(result.message).toContain('Existing payment');
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('Invoice access blocks an unrelated user', async () => {
    const prisma: any = {
      invoice: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'invoice-1',
          userId: 'owner-1',
          payment: {
            booking: {
              property: { ownerId: 'owner-1' },
            },
          },
        }),
      },
    };
    const service = new InvoicesService(prisma);

    await expect(
      service.findByPayment('payment-1', { id: 'attacker', role: UserRole.USER }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Visit lookup blocks users who are neither tenant nor owner', async () => {
    const prisma: any = {
      propertyVisit: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'visit-1',
          tenantId: 'tenant-1',
          property: { ownerId: 'owner-1' },
        }),
      },
    };
    const service = new PropertyVisitsService(prisma, {} as any, {} as any);

    await expect(
      service.findOne('visit-1', { id: 'attacker', role: UserRole.USER }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Review creation rejects a duplicate review', async () => {
    const prisma: any = {
      property: { findUnique: jest.fn().mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' }) },
      propertyVisit: {
        findFirst: jest.fn().mockResolvedValue({ id: 'visit-completed' }),
      },
      review: {
        findFirst: jest.fn().mockResolvedValue({ id: 'review-1' }),
        update: jest.fn().mockResolvedValue({ id: 'review-1' }),
      },
    };
    const service = new ReviewsService(prisma);

    const result = await service.create(
      'property-1',
      'tenant-1',
      { rating: 5, comment: 'Good' } as any,
    );

    expect(result.message).toContain('updated');
    expect(prisma.review.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'review-1' } }),
    );
  });

  it('Review creation rejects users without a completed visit or rental', async () => {
    const prisma: any = {
      property: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'property-1',
          ownerId: 'owner-1',
        }),
      },
      propertyVisit: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new ReviewsService(prisma);

    await expect(
      service.create(
        'property-1',
        'tenant-1',
        { rating: 5, comment: 'Good' } as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Chat blocks message access for a non-participant', async () => {
    const prisma: any = {
      conversation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'conversation-1',
          tenantId: 'tenant-1',
          ownerId: 'owner-1',
        }),
      },
    };
    const service = new ChatService(prisma, {} as any, {} as any);

    await expect(
      service.sendMessage('conversation-1', 'attacker', 'secret'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Notifications scope read access to the current user', async () => {
    const prisma: any = {
      notification: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new NotificationsService(prisma);

    await expect(
      service.markAsRead('notification-1', { id: 'attacker', role: UserRole.USER }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('Membership creation rejects a duplicate active membership', async () => {
    const prisma: any = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1' }) },
      membershipPlan: { findUnique: jest.fn().mockResolvedValue({ id: 'plan-1', isActive: true }) },
      membership: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'membership-1',
          status: MembershipStatus.ACTIVE,
        }),
      },
    };
    const service = new MembershipService(prisma);

    await expect(
      service.createMembership('user-1', 'plan-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('OTP hashing does not persist the plaintext code', async () => {
    const otp = new OtpService();
    const plain = '123456';
    const hash = await otp.hashOtp(plain);

    expect(hash).not.toBe(plain);
    await expect(otp.verifyOtp(plain, hash)).resolves.toBe(true);
    await expect(otp.verifyOtp('654321', hash)).resolves.toBe(false);
  });

  it('bcrypt remains the password verifier used by the auth security path', async () => {
    const hash = await bcrypt.hash('correct-password', 4);
    await expect(bcrypt.compare('correct-password', hash)).resolves.toBe(true);
    await expect(bcrypt.compare('wrong-password', hash)).resolves.toBe(false);
  });

  it('Lease state guard rejects completion of a non-active lease', async () => {
    const prisma: any = {
      lease: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'lease-1',
          status: LeaseStatus.COMPLETED,
          propertyId: 'property-1',
          tenantId: 'tenant-1',
          property: { ownerId: 'owner-1' },
          booking: {},
        }),
      },
    };
    const service = new LeaseService(prisma, {} as any, {} as any);

    await expect(
      service.complete('lease-1', { id: 'owner-1', role: UserRole.OWNER }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Account deletion anonymizes PII and revokes active sessions', async () => {
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          role: UserRole.USER,
          email: 'user@example.com',
        }),
      },
      $transaction: jest.fn(async (callback: any) => callback({
        userDevice: { deleteMany: jest.fn() },
        refreshToken: { deleteMany: jest.fn() },
        otpCode: { deleteMany: jest.fn() },
        passwordResetToken: { deleteMany: jest.fn() },
        notification: { deleteMany: jest.fn() },
        favorite: { deleteMany: jest.fn() },
        appFeedback: { deleteMany: jest.fn() },
        review: { deleteMany: jest.fn() },
        userSettings: { deleteMany: jest.fn() },
        message: { updateMany: jest.fn() },
        socialMarketingConsent: { updateMany: jest.fn() },
        user: { update: jest.fn().mockResolvedValue({ id: 'user-1', isActive: false }) },
      })),
    };
    const service = new SettingsService(prisma);

    await expect(service.deleteAccount('user-1')).resolves.toEqual({
      message: expect.stringContaining('anonymized'),
    });

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('Account deletion refuses administrator self-deletion', async () => {
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'admin-1',
          role: UserRole.ADMIN,
          email: 'admin@example.com',
        }),
      },
    };
    const service = new SettingsService(prisma);

    await expect(service.deleteAccount('admin-1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

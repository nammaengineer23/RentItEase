import { MailService } from './mail.service';

describe('MailService notification preferences', () => {
  const sendMail = jest.fn();
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string | number> = {
        MAIL_HOST: 'smtp.example.com',
        MAIL_PORT: 587,
        MAIL_USER: 'mailer',
        MAIL_PASSWORD: 'secret',
        MAIL_FROM: 'RentItEase <contact@rentitease.com>',
      };
      return values[key];
    }),
  };
  const prisma = {
    user: { findUnique: jest.fn() },
  };

  let service: MailService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MailService(config as any, prisma as any);
    (service as any).transporter = { sendMail };
  });

  it('skips event email when the recipient disabled email notifications', async () => {
    prisma.user.findUnique.mockResolvedValue({
      settings: { emailNotifications: false },
    });

    await service.sendVisitApprovalEmail(
      'tenant@example.com',
      'Tenant',
      'Verified House',
      'Tomorrow',
    );

    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends event email when notifications are enabled', async () => {
    prisma.user.findUnique.mockResolvedValue({
      settings: { emailNotifications: true },
    });

    await service.sendVisitCompletedEmail(
      'tenant@example.com',
      'Tenant',
      'Verified House',
    );

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'tenant@example.com' }),
    );
  });

  it('always sends security OTP email regardless of preference', async () => {
    prisma.user.findUnique.mockResolvedValue({
      settings: { emailNotifications: false },
    });

    await service.sendAuthenticationOtp('tenant@example.com', '123456');

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'tenant@example.com',
        subject: 'Your RentItEase verification code',
      }),
    );
  });
});

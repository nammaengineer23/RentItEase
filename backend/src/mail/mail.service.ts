import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailerService } from '@nestjs-modules/mailer';
@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: Number(this.configService.get<number>('MAIL_PORT')),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  // ==========================================
  // Authentication OTP
  // ==========================================

  async sendAuthenticationOtp(email: string, otp: string) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Your RentItEase verification code',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
          <h2>Verify your RentItEase account</h2>
          <p>Enter this one-time code in the RentItEase app:</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:8px">
            ${otp}
          </p>
          <p>This code expires in 10 minutes.</p>
          <p>If you did not request it, you can ignore this email.</p>
        </div>
      `,
    });
  }

  // ==========================================
  // Welcome Email
  // ==========================================

  async sendWelcomeEmail(email: string, fullName: string) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Welcome to RentItEase 🎉',
      html: `
        <h2>Welcome ${fullName},</h2>

        <p>Thank you for joining <b>RentItEase</b>.</p>

        <p>Your account has been created successfully.</p>

        <br>

        <p>Happy House Hunting!</p>

        <b>RentItEase Team</b>
      `,
    });
  }

  // ==========================================
  // Forgot Password Email
  // ==========================================

  async sendForgotPasswordEmail(
    email: string,
    fullName: string,
    resetLink: string,
  ) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Reset Your RentItEase Password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">

          <h2>Password Reset Request</h2>

          <p>Hello <strong>${fullName}</strong>,</p>

          <p>
            We received a request to reset your RentItEase password.
          </p>

          <p>
            Click the button below to reset it.
          </p>

          <p style="margin:30px 0;">
            <a
              href="${resetLink}"
              style="
                background:#0d6efd;
                color:#fff;
                padding:12px 20px;
                border-radius:6px;
                text-decoration:none;
              "
            >
              Reset Password
            </a>
          </p>

          <p>
            Or open this link:
          </p>

          <p>
            <a href="${resetLink}">
              ${resetLink}
            </a>
          </p>

          <hr>

          <p>
            If you didn't request this password reset,
            simply ignore this email.
          </p>

          <p>
            This link expires in 15 minutes.
          </p>

          <br>

          <strong>RentItEase Team</strong>

        </div>
      `,
    });
  }

  // ==========================================
  // Visit Booked
  // ==========================================

  async sendVisitBookingEmail(
    email: string,
    fullName: string,
    propertyTitle: string,
    visitDate: string,
  ) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Property Visit Booked',
      html: `
        <h2>Hello ${fullName},</h2>

        <p>Your property visit has been booked successfully.</p>

        <p><b>Property:</b> ${propertyTitle}</p>

        <p><b>Date:</b> ${visitDate}</p>

        <br>

        <p>Thank you for choosing RentItEase.</p>

        <b>RentItEase Team</b>
      `,
    });
  }

  // ==========================================
  // Visit Approved
  // ==========================================

  async sendVisitApprovalEmail(
    email: string,
    fullName: string,
    propertyTitle: string,
    visitDate: string,
  ) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Property Visit Approved ✅',
      html: `
        <h2>Hello ${fullName},</h2>

        <p>Your property visit has been approved.</p>

        <p><b>Property:</b> ${propertyTitle}</p>

        <p><b>Date:</b> ${visitDate}</p>

        <br>

        <p>Please arrive on time.</p>

        <b>RentItEase Team</b>
      `,
    });
  }

  // ==========================================
  // Visit Rejected
  // ==========================================

  async sendVisitRejectedEmail(
    email: string,
    fullName: string,
    propertyTitle: string,
  ) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Property Visit Rejected',
      html: `
        <h2>Hello ${fullName},</h2>

        <p>Unfortunately your visit request was rejected.</p>

        <p><b>Property:</b> ${propertyTitle}</p>

        <br>

        <p>You can schedule another visit anytime.</p>

        <b>RentItEase Team</b>
      `,
    });
  }

  // ==========================================
  // Visit Cancelled
  // ==========================================

  async sendVisitCancelledEmail(
    email: string,
    fullName: string,
    propertyTitle: string,
  ) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Property Visit Cancelled',
      html: `
        <h2>Hello ${fullName},</h2>

        <p>Your property visit has been cancelled.</p>

        <p><b>Property:</b> ${propertyTitle}</p>

        <br>

        <p>Please book another convenient slot.</p>

        <b>RentItEase Team</b>
      `,
    });
  }

  // ==========================================
  // Visit Completed
  // ==========================================

  async sendVisitCompletedEmail(
    email: string,
    fullName: string,
    propertyTitle: string,
  ) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Thanks for Visiting 🏡',
      html: `
        <h2>Hello ${fullName},</h2>

        <p>We hope your property visit went well.</p>

        <p><b>Property:</b> ${propertyTitle}</p>

        <br>

        <p>Please don't forget to leave a review.</p>

        <b>RentItEase Team</b>
      `,
    });
  }

  // ==========================================
  // Send Password Reset Mail
  // ==========================================
  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    resetLink: string,
  ) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Reset your RentItEase password',
      html: `
      <h2>Hello ${fullName},</h2>

      <p>We received a request to reset your password.</p>

      <p>
        <a href="${resetLink}">
          Click here to reset your password
        </a>
      </p>

      <p>This link expires in 30 minutes.</p>

      <p>If you didn't request this, you can ignore this email.</p>

      <br/>

      <b>RentItEase Team</b>
    `,
    });
  }
}

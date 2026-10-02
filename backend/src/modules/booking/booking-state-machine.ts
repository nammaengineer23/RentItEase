import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

export const BOOKING_TRANSITIONS: Readonly<Record<BookingStatus, readonly BookingStatus[]>> = {
  [BookingStatus.PENDING]: [BookingStatus.APPROVED, BookingStatus.REJECTED, BookingStatus.CANCELLED],
  [BookingStatus.APPROVED]: [BookingStatus.PAYMENT_PENDING, BookingStatus.CANCELLED],
  [BookingStatus.PAYMENT_PENDING]: [BookingStatus.PAID, BookingStatus.CANCELLED],
  [BookingStatus.PAID]: [BookingStatus.COMPLETED],
  [BookingStatus.REJECTED]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.COMPLETED]: [],
};

export function isBookingTransitionAllowed(from: BookingStatus, to: BookingStatus) {
  return BOOKING_TRANSITIONS[from].includes(to);
}

export function assertBookingTransition(from: BookingStatus, to: BookingStatus): void {
  if (!isBookingTransitionAllowed(from, to)) {
    throw new BadRequestException(
      `Booking cannot transition from ${from} to ${to}.`,
    );
  }
}

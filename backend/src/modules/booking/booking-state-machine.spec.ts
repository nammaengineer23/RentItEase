import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { assertBookingTransition, isBookingTransitionAllowed } from './booking-state-machine';

describe('Booking state machine', () => {
  it.each([
    [BookingStatus.PENDING, BookingStatus.APPROVED],
    [BookingStatus.PENDING, BookingStatus.REJECTED],
    [BookingStatus.PENDING, BookingStatus.CANCELLED],
    [BookingStatus.APPROVED, BookingStatus.PAYMENT_PENDING],
    [BookingStatus.APPROVED, BookingStatus.CANCELLED],
    [BookingStatus.PAYMENT_PENDING, BookingStatus.PAID],
    [BookingStatus.PAYMENT_PENDING, BookingStatus.CANCELLED],
    [BookingStatus.PAID, BookingStatus.COMPLETED],
  ])('allows %s -> %s', (from, to) => {
    expect(isBookingTransitionAllowed(from, to)).toBe(true);
    expect(() => assertBookingTransition(from, to)).not.toThrow();
  });

  it.each([
    [BookingStatus.APPROVED, BookingStatus.PENDING],
    [BookingStatus.PENDING, BookingStatus.PAID],
    [BookingStatus.PAID, BookingStatus.CANCELLED],
    [BookingStatus.REJECTED, BookingStatus.APPROVED],
    [BookingStatus.CANCELLED, BookingStatus.APPROVED],
    [BookingStatus.COMPLETED, BookingStatus.PAID],
  ])('rejects %s -> %s', (from, to) => {
    expect(isBookingTransitionAllowed(from, to)).toBe(false);
    expect(() => assertBookingTransition(from, to)).toThrow(BadRequestException);
  });
});

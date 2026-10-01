import { Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { toMoneyDecimal, toPaise } from '../src/common/utils/money.util';

describe('Money data model', () => {
  it('uses exact Decimal arithmetic instead of floating-point addition', () => {
    const rent = new Prisma.Decimal('1234.56');
    const deposit = new Prisma.Decimal('789.44');

    expect(rent.add(deposit).toFixed(2)).toBe('2024.00');
    expect(new Prisma.Decimal('0.1').add(new Prisma.Decimal('0.2')).toFixed(2)).toBe('0.30');
  });

  it('converts only exact two-decimal money values to gateway paise', () => {
    expect(toPaise(toMoneyDecimal('1234.56'))).toBe(123456);
    expect(toPaise('0.01')).toBe(1);
    expect(() => toPaise('1.005')).toThrow(BadRequestException);
  });

  it('rejects negative monetary state', () => {
    expect(() => toMoneyDecimal('-1.00')).toThrow(BadRequestException);
  });
});

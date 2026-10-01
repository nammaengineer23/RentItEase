import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type MoneyInput = Prisma.Decimal | string | number;

export function toMoneyDecimal(amount: MoneyInput): Prisma.Decimal {
  const decimal = new Prisma.Decimal(amount);
  if (!decimal.isFinite() || decimal.isNegative()) {
    throw new BadRequestException('Invalid monetary amount.');
  }
  return decimal;
}

export function toPaise(amount: MoneyInput): number {
  const decimal = toMoneyDecimal(amount);
  const paise = decimal.mul(100);

  if (!paise.isInteger()) {
    throw new BadRequestException(
      'Monetary amount must have at most two decimal places.',
    );
  }

  const value = paise.toNumber();
  if (!Number.isSafeInteger(value)) {
    throw new BadRequestException(
      'Monetary amount exceeds the supported gateway range.',
    );
  }

  return value;
}

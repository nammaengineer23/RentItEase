import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({
    description: 'Booking ID associated with the payment',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 64)
  bookingId!: string;

  @ApiProperty({
    description: 'Razorpay order ID',
    example: 'order_9A33XWu170gUtm',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 64)
  @Matches(/^order_[A-Za-z0-9]+$/, {
    message: 'razorpayOrderId must be a valid Razorpay order ID.',
  })
  razorpayOrderId!: string;

  @ApiProperty({
    description: 'Razorpay payment ID',
    example: 'pay_29QQoUBi66xm2f',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 64)
  @Matches(/^pay_[A-Za-z0-9]+$/, {
    message: 'razorpayPaymentId must be a valid Razorpay payment ID.',
  })
  razorpayPaymentId!: string;

  @ApiProperty({
    description: 'Razorpay payment signature',
  })
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: 'razorpaySignature must be a valid SHA-256 hex signature.',
  })
  razorpaySignature!: string;
}

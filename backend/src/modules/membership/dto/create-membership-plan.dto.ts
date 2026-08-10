import { MembershipPlanCode } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMembershipPlanDto {
  @IsString()
  name!: string;

  @IsEnum(MembershipPlanCode)
  code!: MembershipPlanCode;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(1)
  durationDays!: number;
}
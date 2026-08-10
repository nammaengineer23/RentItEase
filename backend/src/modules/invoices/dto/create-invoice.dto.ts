import {
    IsNumber,
    IsOptional,
    IsString,
    Min,
  } from 'class-validator';
  
  export class CreateInvoiceDto {
    @IsString()
    userId!: string;
  
    @IsOptional()
    @IsString()
    paymentId?: string;
  
    @IsNumber()
    @Min(0)
    amount!: number;
  
    @IsOptional()
    @IsNumber()
    @Min(0)
    taxAmount?: number;
  
    @IsString()
    description!: string;
  
    @IsOptional()
    @IsString()
    currency?: string;
  
    @IsOptional()
    @IsString()
    dueDate?: string;
  }
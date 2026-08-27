import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateAppFeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;
}

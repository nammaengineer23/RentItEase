import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePropertyEnquiryDto, UpdatePropertyEnquiryStatusDto } from './dto/property-enquiry.dto';
import { PropertyEnquiriesService } from './property-enquiries.service';

@ApiTags('Property Enquiries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('property-enquiries')
export class PropertyEnquiriesController {
  constructor(private readonly enquiries: PropertyEnquiriesService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Send an enquiry for a sale, site-sale, or lease listing (separate from rental bookings)' })
  create(@Body() dto: CreatePropertyEnquiryDto, @Request() req: any) {
    return this.enquiries.create(dto, req.user);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List enquiries sent by the signed-in user' })
  findMine(@Request() req: any) {
    return this.enquiries.findMine(req.user);
  }

  @Get('owner')
  @ApiOperation({ summary: 'List enquiries for listings owned by the signed-in owner' })
  findForOwner(@Request() req: any) {
    return this.enquiries.findForOwner(req.user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update enquiry status as listing owner or administrator' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePropertyEnquiryStatusDto, @Request() req: any) {
    return this.enquiries.updateStatus(id, dto, req.user);
  }
}

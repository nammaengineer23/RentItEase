import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PropertyVisitsService } from './property-visits.service';
import { CreatePropertyVisitDto } from './dto/create-property-visit.dto';
import { UpdatePropertyVisitDto } from './dto/update-property-visit.dto';

@ApiTags('Property Visits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('property-visits')
export class PropertyVisitsController {
  constructor(private readonly propertyVisitsService: PropertyVisitsService) {}

  // ============================================================
  // Tenant: Book Visit
  // ============================================================

  @Post()
  @ApiOperation({
    summary: 'Book a property visit',
  })
  create(@Body() dto: CreatePropertyVisitDto, @Request() req: any) {
    return this.propertyVisitsService.create(dto, req.user);
  }

  // ============================================================
  // Tenant: My Visits
  //
  // GET /property-visits
  //
  // Non-admin users receive only their own tenant visits.
  // Admin receives all visits.
  // ============================================================

  @Get()
  @ApiOperation({
    summary: 'Get my property visits',
  })
  findAll(@Request() req: any) {
    return this.propertyVisitsService.findAll(req.user);
  }

  // ============================================================
  // Owner: Visit Requests
  // ============================================================

  @Get('owner')
  @ApiOperation({
    summary: 'Get property visit requests for owner',
  })
  getOwnerVisits(@Request() req: any) {
    return this.propertyVisitsService.getOwnerVisits(req.user);
  }

  // ============================================================
  // Get Single Visit
  //
  // Only:
  // - tenant belonging to visit
  // - property owner
  // - admin
  // ============================================================

  @Get(':id')
  @ApiOperation({
    summary: 'Get a property visit',
  })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.propertyVisitsService.findOne(id, req.user);
  }

  // ============================================================
  // Owner/Admin: Approve
  // ============================================================

  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve property visit',
  })
  approveVisit(@Param('id') id: string, @Request() req: any) {
    return this.propertyVisitsService.approveVisit(id, req.user);
  }

  // ============================================================
  // Owner/Admin: Reject
  // ============================================================

  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Reject property visit',
  })
  rejectVisit(@Param('id') id: string, @Request() req: any) {
    return this.propertyVisitsService.rejectVisit(id, req.user);
  }

  // ============================================================
  // Owner/Admin: Complete
  // ============================================================

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Complete property visit',
  })
  completeVisit(@Param('id') id: string, @Request() req: any) {
    return this.propertyVisitsService.completeVisit(id, req.user);
  }

  // ============================================================
  // Tenant/Owner/Admin: Cancel
  // ============================================================

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel property visit',
  })
  cancelVisit(@Param('id') id: string, @Request() req: any) {
    return this.propertyVisitsService.cancelVisit(id, req.user);
  }

  // ============================================================
  // Authorized Update
  // ============================================================

  @Patch(':id')
  @ApiOperation({
    summary: 'Update property visit',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyVisitDto,
    @Request() req: any,
  ) {
    return this.propertyVisitsService.update(id, dto, req.user);
  }

  // ============================================================
  // Authorized Delete
  // ============================================================

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete property visit',
  })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.propertyVisitsService.remove(id, req.user);
  }
}

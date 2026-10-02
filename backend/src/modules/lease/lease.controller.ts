import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { LeaseService } from './lease.service';
import { CreateLeaseDto } from './dto/create-lease.dto';

@ApiTags('Leases')
@Controller('leases')
export class LeaseController {
  constructor(private readonly leaseService: LeaseService) {}

  // =====================================
  // Create Lease
  // =====================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create lease from paid booking',
  })
  create(@Body() dto: CreateLeaseDto, @Request() req: any) {
    return this.leaseService.create(dto, req.user);
  }

  // =====================================
  // Tenant Leases
  // =====================================

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get logged-in tenant leases',
  })
  getTenantLeases(@Request() req: any) {
    return this.leaseService.getTenantLeases(req.user);
  }

  // =====================================
  // Owner Leases
  // =====================================

  @Get('owner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get owner leases',
  })
  getOwnerLeases(@Request() req: any) {
    return this.leaseService.getOwnerLeases(req.user);
  }

  // =====================================
  // Get Lease
  // =====================================

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get lease by ID',
  })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.leaseService.findOne(id, req.user);
  }

  // =====================================
  // Complete Lease
  // =====================================

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete lease',
  })
  complete(@Param('id') id: string, @Request() req: any) {
    return this.leaseService.complete(id, req.user);
  }

  // =====================================
  // Terminate Lease
  // =====================================

  @Patch(':id/terminate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Terminate lease',
  })
  terminate(@Param('id') id: string, @Request() req: any) {
    return this.leaseService.terminate(id, req.user);
  }

  // =====================================
  // Cancel Lease
  // =====================================

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel lease',
  })
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.leaseService.cancel(id, req.user);
  }
}

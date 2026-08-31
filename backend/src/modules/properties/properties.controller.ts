import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PropertiesService } from './properties.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

import { UserRole } from '@prisma/client';

import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { FilterPropertiesDto } from './dto/filter-property.dto';
import { UpdatePropertyAmenitiesDto } from './dto/update-property-amenities.dto';
import { NearbyPropertiesDto } from './dto/nearby-properties.dto';
@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // Create Property
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create Property',
  })
  create(@Body() createPropertyDto: CreatePropertyDto, @Request() req: any) {
    return this.propertiesService.create(createPropertyDto, req.user);
  }

  @Post('ai-suggestion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.OWNER)
  @ApiBearerAuth()
  suggestListing(@Body() body: any) {
    return this.propertiesService.suggestListingText(body);
  }

  // Get All Properties
  @Get()
  @ApiOperation({
    summary: 'Get All Properties',
  })
  findAll(@Query() filterDto: FilterPropertiesDto) {
    return this.propertiesService.findAll(filterDto);
  }

  // ===========================
  // Update Property Amenities
  // ===========================

  @Post(':id/amenities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Assign amenities to property',
  })
  updateAmenities(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyAmenitiesDto,
    @Request() req: any,
  ) {
    return this.propertiesService.updateAmenities(id, dto, req.user);
  }
  // ===========================
  // Owner - My Properties
  // ===========================

  @Get('my-properties')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get logged-in owner properties',
  })
  findMyProperties(@Request() req: any) {
    return this.propertiesService.findMyProperties(req.user);
  }
  //Home Screen Data
  @Get('home')
  @ApiOperation({
    summary: 'Home Screen Data',
  })
  home() {
    return this.propertiesService.home();
  }

  // ===========================
  // Nearby Properties
  // ===========================

  @Get('nearby')
  @ApiOperation({
    summary: 'Find nearby properties',
  })
  nearby(@Query() query: NearbyPropertiesDto) {
    return this.propertiesService.findNearby(query);
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  recordView(@Param('id') id: string, @Request() req: any) {
    return this.propertiesService.recordView(id, req.user);
  }

  @Get(':id/contact')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get owner contact for an eligible member',
  })
  getOwnerContact(@Param('id') id: string, @Request() req: any) {
    return this.propertiesService.getOwnerContact(id, req.user);
  }

  // Get Property By Id
  @Get(':id')
  @ApiOperation({
    summary: 'Get Property By ID',
  })
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  // Update Property
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update Property',
  })
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Request() req: any,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, req.user);
  }

  // Delete Property
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete Property',
  })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.propertiesService.remove(id, req.user);
  }
}

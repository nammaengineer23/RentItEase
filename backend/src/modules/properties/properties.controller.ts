import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { FilterPropertiesDto } from './dto/filter-property.dto';
import { NearbyPropertiesDto } from './dto/nearby-properties.dto';
import { UpdatePropertyAmenitiesDto } from './dto/update-property-amenities.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ListingAiService } from './listing-ai.service';
import { PropertiesService } from './properties.service';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService, private readonly listingAi: ListingAiService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Property' })
  create(@Body() dto: CreatePropertyDto, @Request() req: any) { return this.propertiesService.create(dto, req.user); }

  @Post('ai-suggestion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  suggestListing(@Body() body: Record<string, unknown>) { return this.listingAi.suggest(body); }

  @Get()
  @ApiOperation({ summary: 'Get All Properties' })
  findAll(@Query() dto: FilterPropertiesDto) { return this.propertiesService.findAll(dto); }

  @Post(':id/amenities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign amenities to property' })
  updateAmenities(@Param('id') id: string, @Body() dto: UpdatePropertyAmenitiesDto, @Request() req: any) { return this.propertiesService.updateAmenities(id, dto, req.user); }

  @Get('my-properties')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logged-in owner properties' })
  findMyProperties(@Request() req: any) { return this.propertiesService.findMyProperties(req.user); }

  @Get('home')
  @ApiOperation({ summary: 'Home Screen Data' })
  home() { return this.propertiesService.home(); }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby properties' })
  nearby(@Query() query: NearbyPropertiesDto) { return this.propertiesService.findNearby(query); }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  recordView(@Param('id') id: string, @Request() req: any) { return this.propertiesService.recordView(id, req.user); }

  @Get(':id/contact')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get owner contact for an eligible member' })
  getOwnerContact(@Param('id') id: string, @Request() req: any) { return this.propertiesService.getOwnerContact(id, req.user); }

  @Get(':id')
  @ApiOperation({ summary: 'Get Property By ID' })
  findOne(@Param('id') id: string) { return this.propertiesService.findOne(id); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Property' })
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto, @Request() req: any) { return this.propertiesService.update(id, dto, req.user); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete Property' })
  remove(@Param('id') id: string, @Request() req: any) { return this.propertiesService.remove(id, req.user); }
}

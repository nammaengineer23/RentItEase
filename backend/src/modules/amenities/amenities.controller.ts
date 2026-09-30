import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

import { AmenitiesService } from './amenities.service';

import { CreateAmenityDto } from './dto/create-amenity.dto';
import { UpdateAmenityDto } from './dto/update-amenity.dto';

@ApiTags('Amenities')
@Controller('amenities')
export class AmenitiesController {
  constructor(
    private readonly amenitiesService: AmenitiesService,
  ) {}

 @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
@ApiOperation({
  summary: 'Create Amenity',
})
create(
  @Body() createAmenityDto: CreateAmenityDto,
) {
  return this.amenitiesService.create(
    createAmenityDto.name,
  );
}

  @Get()
  @ApiOperation({
    summary: 'Get All Amenities',
  })
  findAll() {
    return this.amenitiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Amenity By ID',
  })
  findOne(
    @Param('id') id: string,
  ) {
    return this.amenitiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
@ApiOperation({
  summary: 'Update Amenity',
})
update(
  @Param('id') id: string,
  @Body() updateAmenityDto: UpdateAmenityDto,
) {
  return this.amenitiesService.update(
    id,
    updateAmenityDto.name!,
  );
}

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete Amenity',
  })
  remove(
    @Param('id') id: string,
  ) {
    return this.amenitiesService.remove(id);
  }
}
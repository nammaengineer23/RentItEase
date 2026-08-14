import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { PropertyImageSection } from '@prisma/client';

import { PropertyImagesService } from './property-images.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReorderImagesDto } from './dto/reorder-images.dto';

@ApiTags('Property Images')
@Controller('property-images')
export class PropertyImagesController {
  constructor(private readonly propertyImagesService: PropertyImagesService) {}

  // ==========================================
  // Upload Images
  // ==========================================

  @Post(':propertyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload property images by section',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          maxItems: 2,
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        isPrimary: {
          type: 'boolean',
          example: false,
        },
        section: {
          type: 'string',
          enum: Object.values(PropertyImageSection),
          example: 'KITCHEN',
        },
      },
      required: ['files', 'section'],
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadImages(
    @Param('propertyId')
    propertyId: string,

    @UploadedFiles()
    files: Express.Multer.File[],

    @Body()
    body: {
      isPrimary?: string | boolean;
      section?: string;
    },

    @Request()
    req: any,
  ) {
    const section =
      body.section &&
      Object.values(PropertyImageSection).includes(
        body.section as PropertyImageSection,
      )
        ? (body.section as PropertyImageSection)
        : PropertyImageSection.OTHER;

    const isPrimary = body.isPrimary === true || body.isPrimary === 'true';

    return this.propertyImagesService.uploadImages(
      propertyId,
      files,
      isPrimary,
      section,
      req.user,
    );
  }

  // ==========================================
  // Get Images
  // ==========================================

  @Get(':propertyId')
  @ApiOperation({
    summary: 'Get property images',
  })
  getImages(
    @Param('propertyId')
    propertyId: string,
  ) {
    return this.propertyImagesService.getImages(propertyId);
  }

  // ==========================================
  // Set Primary Image
  // ==========================================

  @Patch(':propertyId/primary/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Set primary image',
  })
  setPrimary(
    @Param('propertyId')
    propertyId: string,

    @Param('imageId')
    imageId: string,

    @Request()
    req: any,
  ) {
    return this.propertyImagesService.setPrimary(propertyId, imageId, req.user);
  }

  // ==========================================
  // Reorder Images
  // ==========================================

  @Patch(':propertyId/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reorder property images',
  })
  reorderImages(
    @Param('propertyId')
    propertyId: string,

    @Body()
    dto: ReorderImagesDto,

    @Request()
    req: any,
  ) {
    return this.propertyImagesService.reorderImages(propertyId, dto, req.user);
  }

  // ==========================================
  // Delete Image
  // ==========================================

  @Delete(':propertyId/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete property image',
  })
  deleteImage(
    @Param('propertyId')
    propertyId: string,

    @Param('imageId')
    imageId: string,

    @Request()
    req: any,
  ) {
    return this.propertyImagesService.deleteImage(
      propertyId,
      imageId,
      req.user,
    );
  }
}

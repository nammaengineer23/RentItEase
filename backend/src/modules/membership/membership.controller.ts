import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';
import { MembershipService } from './membership.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('membership')
export class MembershipController {
  constructor(
    private readonly membershipService: MembershipService,
  ) {}

  @Post('plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createPlan(@Body() dto: CreateMembershipPlanDto) {
    return this.membershipService.createPlan(dto);
  }

  @Get('plans')
  getPlans(
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.membershipService.getPlans(
      includeInactive === 'true',
    );
  }

  @Get('plans/:id')
  getPlan(@Param('id') id: string) {
    return this.membershipService.getPlan(id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyMemberships(@Request() req: any) {
    return this.membershipService.getUserMemberships(req.user.id);
  }

  @Post('me/premium/request')
  @UseGuards(JwtAuthGuard)
  requestPremiumMembership(@Request() req: any) {
    return this.membershipService.requestPremiumMembership(req.user.id);
  }

  @Post('me/premium/verify')
  @UseGuards(JwtAuthGuard)
  verifyPremiumPayment(
    @Request() req: any,
    @Body()
    body: {
      membershipId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ) {
    return this.membershipService.verifyPremiumPayment(req.user.id, body);
  }

  @Patch('plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipPlanDto,
  ) {
    return this.membershipService.updatePlan(id, dto);
  }

  @Patch('plans/:id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deactivatePlan(@Param('id') id: string) {
    return this.membershipService.deactivatePlan(id);
  }

  @Post('users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createMembership(
    @Param('userId') userId: string,
    @Body()
    body: {
      planId: string;
      autoRenew?: boolean;
      notes?: string;
    },
  ) {
    return this.membershipService.createMembership(
      userId,
      body.planId,
      body.autoRenew ?? false,
      body.notes,
    );
  }

  @Get('users/:userId')
  @UseGuards(JwtAuthGuard)
  getUserMemberships(@Param('userId') userId: string, @Request() req: any) {
    return this.membershipService.getUserMemberships(userId, req.user);
  }

  @Get('users/:userId/active')
  @UseGuards(JwtAuthGuard)
  getActiveMembership(@Param('userId') userId: string, @Request() req: any) {
    return this.membershipService.getActiveMembership(userId, req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getMembership(@Param('id') id: string, @Request() req: any) {
    return this.membershipService.getMembership(id, req.user);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard)
  activateMembership(@Param('id') id: string, @Request() req: any) {
    return this.membershipService.activateMembership(id, req.user);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancelMembership(@Param('id') id: string, @Request() req: any) {
    return this.membershipService.cancelMembership(id, req.user);
  }

  @Patch(':id/expire')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  expireMembership(@Param('id') id: string) {
    return this.membershipService.expireMembership(id);
  }

  @Patch(':id/renew')
  @UseGuards(JwtAuthGuard)
  renewMembership(@Param('id') id: string, @Request() req: any) {
    return this.membershipService.renewMembership(id, req.user);
  }

  @Patch(':id/auto-renew')
  @UseGuards(JwtAuthGuard)
  updateAutoRenew(
    @Param('id') id: string,
    @Body() body: { autoRenew: boolean },
    @Request() req: any,
  ) {
    return this.membershipService.updateAutoRenew(id, body.autoRenew, req.user);
  }

  @Post('expire-due')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  expireDueMemberships() {
    return this.membershipService.expireDueMemberships();
  }
}

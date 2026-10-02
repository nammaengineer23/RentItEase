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

import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';
import { MembershipService } from './membership.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('membership')
export class MembershipController {
  constructor(
    private readonly membershipService: MembershipService,
  ) {}

  @Post('plans')
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
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipPlanDto,
  ) {
    return this.membershipService.updatePlan(id, dto);
  }

  @Patch('plans/:id/deactivate')
  deactivatePlan(@Param('id') id: string) {
    return this.membershipService.deactivatePlan(id);
  }

  @Post('users/:userId')
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
  getUserMemberships(@Param('userId') userId: string) {
    return this.membershipService.getUserMemberships(userId);
  }

  @Get('users/:userId/active')
  getActiveMembership(@Param('userId') userId: string) {
    return this.membershipService.getActiveMembership(userId);
  }

  @Get(':id')
  getMembership(@Param('id') id: string) {
    return this.membershipService.getMembership(id);
  }

  @Patch(':id/activate')
  activateMembership(@Param('id') id: string) {
    return this.membershipService.activateMembership(id);
  }

  @Patch(':id/cancel')
  cancelMembership(@Param('id') id: string) {
    return this.membershipService.cancelMembership(id);
  }

  @Patch(':id/expire')
  expireMembership(@Param('id') id: string) {
    return this.membershipService.expireMembership(id);
  }

  @Patch(':id/renew')
  renewMembership(@Param('id') id: string) {
    return this.membershipService.renewMembership(id);
  }

  @Patch(':id/auto-renew')
  updateAutoRenew(
    @Param('id') id: string,
    @Body() body: { autoRenew: boolean },
  ) {
    return this.membershipService.updateAutoRenew(
      id,
      body.autoRenew,
    );
  }

  @Post('expire-due')
  expireDueMemberships() {
    return this.membershipService.expireDueMemberships();
  }
}

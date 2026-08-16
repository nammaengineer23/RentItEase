// In the existing Admin Property Approval service, immediately after the
// property is successfully approved, call:
//
// await this.socialMediaService.onPropertyApproved(propertyId);
//
// Add the service to that service's constructor:
//
// private readonly socialMediaService: SocialMediaService,
//
// and import:
//
// import { SocialMediaService } from '../social-media/social-media.service';
//
// Keep this call AFTER the approval transaction succeeds. The social workflow
// checks the owner's consent before doing anything.
//
// If your approval service uses a database transaction, trigger the social
// workflow after the transaction commits rather than inside the transaction.

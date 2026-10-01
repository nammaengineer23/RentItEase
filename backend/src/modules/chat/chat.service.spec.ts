jest.mock('../push-notifications/push-notifications.service', () => ({ PushNotificationsService: class {} }));
jest.mock('../notifications/notifications.service', () => ({ NotificationsService: class {} }));
jest.mock('../../storage/storage.service', () => ({ StorageService: class {} }));
jest.mock('../../storage/file-scan.service', () => ({ FileScanService: class {} }));

import { ChatService } from './chat.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('ChatService hardening', () => {
  const prisma:any = {
    conversation:{ findUnique:jest.fn(), findMany:jest.fn(), create:jest.fn(), update:jest.fn() },
    message:{ create:jest.fn(), count:jest.fn(), findUnique:jest.fn(), findMany:jest.fn(), update:jest.fn(), updateMany:jest.fn() },
    user:{ findMany:jest.fn() },
  };
  const notifications:any={createNotification:jest.fn().mockResolvedValue(undefined)};
  const push:any={sendToUser:jest.fn().mockResolvedValue(undefined)};
  const storage:any={uploadPrivateFile:jest.fn(),deleteImage:jest.fn(),getPrivateUrl:jest.fn()};
  const scan:any={scan:jest.fn()};
  let service:ChatService;
  beforeEach(()=>{jest.clearAllMocks();service=new ChatService(prisma,notifications,push,storage,scan);});
  const conversation={id:'c1',ownerId:'owner',tenantId:'tenant',property:{id:'p1',title:'Home'},owner:{id:'owner',fullName:'Owner'},tenant:{id:'tenant',fullName:'Tenant'}};
  it('blocks non-members',async()=>{prisma.conversation.findUnique.mockResolvedValue(conversation);await expect(service.sendMessage('c1','intruder','hi')).rejects.toThrow(ForbiddenException);});
  it('blocks inactive participants',async()=>{prisma.conversation.findUnique.mockResolvedValue(conversation);prisma.user.findMany.mockResolvedValue([{id:'owner',isActive:false},{id:'tenant',isActive:true}]);await expect(service.sendMessage('c1','tenant','hi')).rejects.toThrow(ForbiddenException);});
  it('enforces message rate limiting',async()=>{prisma.conversation.findUnique.mockResolvedValue(conversation);prisma.user.findMany.mockResolvedValue([{id:'owner',isActive:true},{id:'tenant',isActive:true}]);prisma.message.count.mockResolvedValue(20);await expect(service.sendMessage('c1','tenant','hi')).rejects.toThrow(BadRequestException);});
  it('includes unread counts for the current user',async()=>{prisma.conversation.findMany.mockResolvedValue([{...conversation,messages:[],_count:{messages:3},updatedAt:new Date()}]);const result=await service.listConversations('tenant');expect(result[0].unreadCount).toBe(3);});
  it('marks only the other participant unread messages as read',async()=>{prisma.conversation.findUnique.mockResolvedValue(conversation);prisma.message.updateMany.mockResolvedValue({count:2});await service.markAsRead('c1','tenant');expect(prisma.message.updateMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({senderId:{not:'tenant'},readAt:null,deletedAt:null})}));});
  it('requires message ownership for edit and delete',async()=>{prisma.message.findUnique.mockResolvedValue({id:'m1',senderId:'owner',deletedAt:null});await expect(service.editMessage('m1','tenant','x')).rejects.toThrow(ForbiddenException);await expect(service.deleteMessage('m1','tenant')).rejects.toThrow(ForbiddenException);});
});

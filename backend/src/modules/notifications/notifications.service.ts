import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { serializePrisma } from '../../common/utils/prisma-response.util';
import { NotificationType } from '@prisma/client';


@Injectable()
export class NotificationsService {


  constructor(
    private readonly prisma: PrismaService,
  ) {}





  // ==========================================
  // Create Notification (Internal)
  // Used by other modules
  // ==========================================


  async createNotification(

    userId: string,

    title: string,

    message: string,

    type: NotificationType,

    relatedId?: string,

  ) {


    const notification =

      await this.prisma.notification.create({

        data: {

          userId,

          title,

          message,

          type,

          relatedId,

        },

      });



    return serializePrisma(notification);


  }







  // ==========================================
  // Get Logged-in User Notifications
  // ==========================================


  async getMyNotifications(
    user: any,
  ) {


    const notifications =

      await this.prisma.notification.findMany({

        where: {

          userId: user.id,

        },


        orderBy: {

          createdAt: 'desc',

        },


      });




    return serializePrisma({

      total: notifications.length,


      unread:

        notifications.filter(

          (n) => !n.isRead,

        ).length,


      notifications,


    });


  }







  // ==========================================
  // Get Unread Notification Count
  // ==========================================


  async getUnreadCount(
    user: any,
  ) {


    const count =

      await this.prisma.notification.count({

        where: {

          userId: user.id,

          isRead: false,

        },

      });




    return {

      unread: count,

    };


  }







  // ==========================================
  // Mark Single Notification As Read
  // ==========================================


  async markAsRead(

    id: string,

    user: any,

  ) {



    const notification =

      await this.prisma.notification.findFirst({

        where: {

          id,

          userId: user.id,

        },

      });




    if (!notification) {


      throw new NotFoundException(

        'Notification not found.',

      );


    }






    const updated =

      await this.prisma.notification.update({

        where: {

          id,

        },


        data: {

          isRead: true,

        },


      });





    return {


      message:

        'Notification marked as read.',



      notification:

        serializePrisma(updated),


    };


  }








  // ==========================================
  // Mark All Notifications As Read
  // ==========================================


  async markAllAsRead(
    user: any,
  ) {



    await this.prisma.notification.updateMany({

      where: {

        userId: user.id,

        isRead: false,

      },


      data: {

        isRead: true,

      },


    });




    return {


      message:

        'All notifications marked as read.',


    };


  }








  // ==========================================
  // Delete Notification
  // ==========================================


  async remove(

    id: string,

    user: any,

  ) {



    const notification =

      await this.prisma.notification.findFirst({

        where: {

          id,

          userId: user.id,

        },

      });





    if (!notification) {


      throw new NotFoundException(

        'Notification not found.',

      );


    }






    await this.prisma.notification.delete({

      where: {

        id,

      },

    });





    return {


      message:

        'Notification deleted successfully.',


    };


  }





}
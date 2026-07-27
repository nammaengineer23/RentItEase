import '../models/notification_model.dart';

import 'notifications_api.dart';



class NotificationsRepository {


  final NotificationsApi api;



  NotificationsRepository(

    this.api,

  );







  // ==================================
  // GET NOTIFICATIONS
  // ==================================


  Future<List<NotificationModel>>
      getNotifications() async {



    return await api.getNotifications();


  }








  // ==================================
  // MARK AS READ
  // ==================================


  Future<void>

      markAsRead(

    String id,

  ) async {



    await api.markAsRead(

      id,

    );


  }



}
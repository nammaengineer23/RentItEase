import 'package:dio/dio.dart';

import '../models/notification_model.dart';



class NotificationsApi {


  final Dio dio;



  NotificationsApi(

    this.dio,

  );






  // ==================================
  // GET ALL NOTIFICATIONS
  // ==================================


  Future<List<NotificationModel>>
      getNotifications() async {



    final response =
        await dio.get(

      '/notifications',

    );




    final data =
        response.data;



    return (data as List)

        .map(

          (item) =>

              NotificationModel.fromJson(

                item,

              ),

        )

        .toList();


  }








  // ==================================
  // MARK NOTIFICATION AS READ
  // ==================================


  Future<void>

      markAsRead(

    String id,

  ) async {



    await dio.patch(

      '/notifications/$id/read',

    );


  }





}
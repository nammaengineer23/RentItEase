import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/notifications_api.dart';
import '../data/notifications_repository.dart';

import '../models/notification_model.dart';



// ==================================
// Repository Provider
// ==================================


final notificationsRepositoryProvider =
    Provider<NotificationsRepository>((ref) {


  final dio =
      ref.watch(dioProvider);



  return NotificationsRepository(

    NotificationsApi(dio),

  );


});




// ==================================
// Notifications State
// ==================================


class NotificationsState {


  final bool isLoading;


  final List<NotificationModel> notifications;


  final String? error;




  NotificationsState({

    this.isLoading = false,

    this.notifications = const [],

    this.error,

  });






  int get unreadCount {


    return notifications

        .where(

          (notification) =>
              !notification.isRead,

        )

        .length;


  }







  NotificationsState copyWith({

    bool? isLoading,

    List<NotificationModel>? notifications,

    String? error,

  }) {



    return NotificationsState(



      isLoading:

          isLoading ??

          this.isLoading,




      notifications:

          notifications ??

          this.notifications,




      error:

          error ??

          this.error,



    );


  }



}







// ==================================
// Notifications Notifier
// ==================================


class NotificationsNotifier

    extends StateNotifier<NotificationsState> {



  final NotificationsRepository repository;





  NotificationsNotifier(

    this.repository,

  )

      : super(

          NotificationsState(),

        );








  // ==================================
  // LOAD NOTIFICATIONS
  // ==================================


  Future<void>

      loadNotifications() async {



    state =

        state.copyWith(

          isLoading: true,

        );




    try {



      final data =

          await repository.getNotifications();





      state =

          state.copyWith(

            isLoading: false,

            notifications: data,

          );



    }

    catch(e) {



      state =

          state.copyWith(

            isLoading: false,

            error: e.toString(),

          );


    }


  }









  // ==================================
  // MARK AS READ
  // ==================================


  Future<void>

      markAsRead(

    String id,

  ) async {



    try {



      await repository.markAsRead(

        id,

      );





      await loadNotifications();




    }

    catch(e) {



      state =

          state.copyWith(

            error: e.toString(),

          );


    }


  }



}








// ==================================
// Provider
// ==================================


final notificationsProvider =

    StateNotifierProvider<

      NotificationsNotifier,

      NotificationsState

    >((ref) {



  final repository =

      ref.watch(

        notificationsRepositoryProvider,

      );




  return NotificationsNotifier(

    repository,

  );


});
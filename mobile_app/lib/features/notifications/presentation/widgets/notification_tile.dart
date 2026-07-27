import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/notification_model.dart';
import '../../providers/notifications_provider.dart';



class NotificationTile extends ConsumerWidget {


  final NotificationModel notification;



  const NotificationTile({

    super.key,

    required this.notification,

  });






  @override
  Widget build(

    BuildContext context,

    WidgetRef ref,

  ) {



    return Card(


      elevation:
          notification.isRead ? 1 : 3,



      margin:
          const EdgeInsets.only(

        bottom:
            12,

      ),





      child:
      ListTile(



        leading:
        CircleAvatar(


          backgroundColor:

              notification.isRead

                  ? Colors.grey.shade300

                  : Theme.of(context)
                      .colorScheme
                      .primary,



          child:
          Icon(


            _getIcon(

              notification.type,

            ),



            color:
                notification.isRead

                    ? Colors.grey

                    : Colors.white,


          ),



        ),






        title:
        Row(


          children: [


            Expanded(

              child:
              Text(


                notification.title,


                style:
                TextStyle(


                  fontWeight:

                      notification.isRead

                          ? FontWeight.normal

                          : FontWeight.bold,


                ),


              ),

            ),





            if(!notification.isRead)

              Container(


                width:
                    10,


                height:
                    10,



                decoration:
                const BoxDecoration(


                  color:
                      Colors.red,


                  shape:
                      BoxShape.circle,


                ),


              ),



          ],


        ),







        subtitle:
        Column(


          crossAxisAlignment:
              CrossAxisAlignment.start,



          children: [



            const SizedBox(

              height:
                  5,

            ),





            Text(

              notification.message,

            ),






            const SizedBox(

              height:
                  5,

            ),






            Text(


              _formatDate(

                notification.createdAt,

              ),



              style:
              TextStyle(


                fontSize:
                    12,


                color:
                    Colors.grey.shade600,


              ),


            ),



          ],


        ),







        onTap: () async {



          if(!notification.isRead){



            await ref

                .read(

                  notificationsProvider
                      .notifier,

                )

                .markAsRead(

                  notification.id,

                );



          }



        },



      ),



    );

  }









  IconData _getIcon(

    String type,

  ) {



    switch(type){


      case 'VISIT_APPROVED':

        return Icons.check_circle;



      case 'VISIT_REJECTED':

        return Icons.cancel;



      case 'CHAT':

        return Icons.chat;



      case 'PROPERTY':

        return Icons.home;



      default:

        return Icons.notifications;


    }


  }









  String _formatDate(

    DateTime date,

  ){


    return '${date.day}/${date.month}/${date.year}';


  }



}
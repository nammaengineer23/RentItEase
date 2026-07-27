import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../property/providers/property_provider.dart';

import '../../../notifications/providers/notifications_provider.dart';

import '../widgets/bottom_navigation.dart';
import '../widgets/category_grid.dart';
import '../widgets/featured_properties.dart';
import '../widgets/nearby_properties.dart';
import '../widgets/recent_search_widget.dart';
import '../widgets/search_section.dart';



class HomePage extends ConsumerStatefulWidget {

  const HomePage({
    super.key,
  });


  @override
  ConsumerState<HomePage> createState() =>
      _HomePageState();

}






class _HomePageState
    extends ConsumerState<HomePage> {



  int _currentIndex = 0;



  final List<String> _recentSearches = [

    'Whitefield',

    '2 BHK',

    'Under ₹20,000',

  ];







  @override
  void initState() {

    super.initState();


    Future.microtask(() {


      ref

          .read(

            notificationsProvider.notifier,

          )

          .loadNotifications();



    });


  }







  @override
  Widget build(BuildContext context) {



    final properties =
        ref.watch(propertyProvider);



    final notificationState =
        ref.watch(notificationsProvider);




    final featured =
        properties

            .where(
              (e) => e.isFeatured,
            )

            .toList();







    return Scaffold(



      appBar: AppBar(


        elevation:
            0,


        centerTitle:
            false,



        title:
        const Column(


          crossAxisAlignment:
              CrossAxisAlignment.start,



          children: [


            Text(

              'RentEase',

              style:
              TextStyle(

                fontWeight:
                    FontWeight.bold,


                fontSize:
                    22,


              ),

            ),





            Text(

              'Find your perfect home',

              style:
              TextStyle(

                fontSize:
                    13,


                fontWeight:
                    FontWeight.w400,


              ),

            ),


          ],


        ),






        actions: [



          Stack(



            children: [



              IconButton(



                onPressed: () {


                  context.push(
                    '/notifications',
                  );


                },



                icon:
                    const Icon(

                  Icons.notifications_none,

                ),



              ),





              if(notificationState.unreadCount > 0)



                Positioned(



                  right:
                      8,



                  top:
                      8,



                  child:
                  Container(


                    padding:
                        const EdgeInsets.all(4),



                    decoration:
                    const BoxDecoration(


                      color:
                          Colors.red,


                      shape:
                          BoxShape.circle,


                    ),





                    child:
                    Text(



                      notificationState
                          .unreadCount
                          .toString(),



                      style:
                      const TextStyle(


                        color:
                            Colors.white,


                        fontSize:
                            10,


                        fontWeight:
                            FontWeight.bold,


                      ),



                    ),


                  ),



                ),



            ],



          ),



        ],


      ),







      body:
      SingleChildScrollView(


        child:
        Column(



          crossAxisAlignment:
              CrossAxisAlignment.start,



          children: [



            SearchSection(


              onChanged: (value) {

                // TODO

              },


            ),





            const SizedBox(
              height: 10,
            ),





            const CategoryGrid(),





            const SizedBox(
              height: 28,
            ),





            FeaturedProperties(


              properties:
                  featured,



              onTap: (property) {


                // TODO open details


              },


            ),






            const SizedBox(
              height: 30,
            ),






            RecentSearchWidget(



              recentSearches:
                  _recentSearches,



              onSearchSelected: (search) {


                debugPrint(search);


              },



              onDeleteSearch: (search) {


                setState(() {


                  _recentSearches
                      .remove(search);


                });


              },


            ),







            const SizedBox(
              height: 20,
            ),






            NearbyProperties(



              properties:
                  properties,



              onTap: (property) {


                // TODO open details


              },


            ),





            const SizedBox(
              height: 20,
            ),



          ],


        ),


      ),






      bottomNavigationBar:
      HomeBottomNavigation(



        currentIndex:
            _currentIndex,



        onTap: (index) {


          setState(() {


            _currentIndex =
                index;


          });



          // TODO navigation


        },



      ),



    );

  }



}
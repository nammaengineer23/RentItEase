import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/owner_provider.dart';



class OwnerAnalyticsPage extends ConsumerWidget {


  const OwnerAnalyticsPage({

    super.key,

  });




  @override
  Widget build(
    BuildContext context,
    WidgetRef ref,
  ) {



    final state =
        ref.watch(ownerProvider);




    return Scaffold(


      appBar: AppBar(

        title:
            const Text(
          'Analytics',
        ),

      ),





      body: state.isLoading


          ?


      const Center(

        child:
            CircularProgressIndicator(),

      )



          :



      SingleChildScrollView(


        padding:
            const EdgeInsets.all(16),



        child:
        Column(


          crossAxisAlignment:
              CrossAxisAlignment.start,



          children: [





            const Text(


              'Property Performance',



              style:
              TextStyle(


                fontSize:
                    22,


                fontWeight:
                    FontWeight.bold,


              ),


            ),





            const SizedBox(

              height:
                  20,

            ),






            GridView.count(


              shrinkWrap:
                  true,



              physics:
                  const NeverScrollableScrollPhysics(),



              crossAxisCount:
                  2,



              crossAxisSpacing:
                  12,



              mainAxisSpacing:
                  12,



              children: [





                _analyticsCard(


                  icon:
                      Icons.visibility,



                  title:
                      'Total Views',



                  value:

                  state.analytics
                      ?.totalViews
                      .toString()
                      ??
                      '0',


                ),






                _analyticsCard(


                  icon:
                      Icons.favorite,



                  title:
                      'Favorites',



                  value:

                  state.analytics
                      ?.totalFavorites
                      .toString()
                      ??
                      '0',


                ),






                _analyticsCard(


                  icon:
                      Icons.calendar_month,



                  title:
                      'Visits',



                  value:

                  state.analytics
                      ?.totalVisits
                      .toString()
                      ??
                      '0',


                ),






                _analyticsCard(


                  icon:
                      Icons.home,



                  title:
                      'Properties',



                  value:

                  state.analytics
                      ?.totalProperties
                      .toString()
                      ??
                      '0',


                ),





              ],

            ),






            const SizedBox(

              height:
                  30,

            ),






            const Text(


              'Recent Activity',



              style:
              TextStyle(


                fontSize:
                    20,


                fontWeight:
                    FontWeight.bold,


              ),


            ),





            const SizedBox(

              height:
                  15,

            ),






            _activityTile(


              icon:
                  Icons.visibility,



              title:
                  'Property Viewed',



              subtitle:
                  'Your property received new views',


            ),






            _activityTile(


              icon:
                  Icons.favorite,



              title:
                  'New Favorite',



              subtitle:
                  'Someone saved your property',


            ),






            _activityTile(


              icon:
                  Icons.calendar_today,



              title:
                  'New Visit Request',



              subtitle:
                  'Tenant requested property visit',


            ),





          ],

        ),

      ),

    );

  }








  Widget _analyticsCard({


    required IconData icon,


    required String title,


    required String value,


  }) {


    return Card(


      elevation:
          3,



      child:
      Column(


        mainAxisAlignment:
            MainAxisAlignment.center,



        children: [





          Icon(


            icon,


            size:
                35,


          ),






          const SizedBox(

            height:
                10,

          ),






          Text(


            value,



            style:
            const TextStyle(



              fontSize:
                  26,



              fontWeight:
                  FontWeight.bold,



            ),


          ),






          Text(title),





        ],

      ),

    );

  }








  Widget _activityTile({


    required IconData icon,


    required String title,


    required String subtitle,


  }) {


    return Card(


      child:
      ListTile(


        leading:
            Icon(icon),



        title:
            Text(title),



        subtitle:
            Text(subtitle),



      ),

    );

  }


}
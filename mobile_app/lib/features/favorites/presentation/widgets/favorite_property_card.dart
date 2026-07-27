import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/favorite_property_model.dart';
import '../../providers/favorites_provider.dart';



class FavoritePropertyCard extends ConsumerWidget {


  final FavoritePropertyModel property;



  const FavoritePropertyCard({

    super.key,

    required this.property,

  });






  @override
  Widget build(

    BuildContext context,

    WidgetRef ref,

  ) {


    return Card(


      elevation:
          3,



      margin:
          const EdgeInsets.only(

        bottom:
            16,

      ),




      child:
      Padding(


        padding:
            const EdgeInsets.all(12),




        child:
        Column(


          crossAxisAlignment:
              CrossAxisAlignment.start,



          children: [





            Container(


              height:
                  160,



              width:
                  double.infinity,



              decoration:
              BoxDecoration(


                borderRadius:
                    BorderRadius.circular(
                      12,
                    ),



                color:
                    Colors.grey.shade300,


              ),




              child:
                  property.imageUrl != null


                      ? ClipRRect(


                          borderRadius:
                              BorderRadius.circular(
                                12,
                              ),


                          child:
                          Image.network(


                            property.imageUrl!,


                            fit:
                                BoxFit.cover,


                            width:
                                double.infinity,


                          ),

                        )



                      : const Icon(


                          Icons.home,


                          size:
                              60,


                        ),



            ),






            const SizedBox(

              height:
                  12,

            ),






            Row(


              mainAxisAlignment:
                  MainAxisAlignment.spaceBetween,



              children: [



                Expanded(


                  child:
                  Text(


                    property.title,



                    style:
                    const TextStyle(



                      fontSize:
                          18,



                      fontWeight:
                          FontWeight.bold,



                    ),



                  ),

                ),





                IconButton(


                  onPressed: () async {



                    await ref

                        .read(

                          favoritesProvider
                              .notifier,

                        )

                        .removeFavorite(

                          property.propertyId,

                        );


                  },



                  icon:
                      const Icon(

                    Icons.favorite,

                    color:
                        Colors.red,

                  ),



                ),



              ],


            ),








            const SizedBox(

              height:
                  8,

            ),








            Row(


              children: [



                const Icon(

                  Icons.location_on,

                  size:
                      18,

                ),




                const SizedBox(

                  width:
                      5,

                ),




                Expanded(

                  child:
                  Text(

                    property.location,

                  ),

                ),



              ],



            ),









            const SizedBox(

              height:
                  8,

            ),








            Text(


              '₹${property.rent}/month',



              style:
              const TextStyle(



                fontSize:
                    16,



                fontWeight:
                    FontWeight.bold,



              ),



            ),





          ],


        ),


      ),


    );

  }


}
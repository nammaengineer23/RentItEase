import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/owner_provider.dart';
import 'edit_property_page.dart';
import 'property_details_page.dart';


class MyPropertiesPage extends ConsumerStatefulWidget {

  const MyPropertiesPage({
    super.key,
  });


  @override
  ConsumerState<MyPropertiesPage> createState() =>
      _MyPropertiesPageState();

}



class _MyPropertiesPageState
    extends ConsumerState<MyPropertiesPage> {


  @override
  void initState() {

    super.initState();


    Future.microtask(() {

      ref
          .read(ownerProvider.notifier)
          .loadProperties();

    });

  }




  @override
  Widget build(BuildContext context) {


    final state =
        ref.watch(ownerProvider);



    return Scaffold(


      appBar: AppBar(

        title:
            const Text(
          'My Properties',
        ),

      ),



      floatingActionButton:
          FloatingActionButton(


        onPressed: () {


          // Navigate Add Property Page


        },


        child:
            const Icon(
          Icons.add,
        ),

      ),




      body:


      state.isLoading


          ?


      const Center(

        child:
            CircularProgressIndicator(),

      )



          :



      state.properties.isEmpty


          ?


      const Center(

        child:
            Text(

          'No Properties Added',

          style:
              TextStyle(

            fontSize:
                18,

          ),

        ),

      )



          :



      ListView.builder(


        padding:
            const EdgeInsets.all(16),



        itemCount:
            state.properties.length,



        itemBuilder:
            (context, index) {


          final property =
              state.properties[index];



          return Card(


            elevation:
                3,



            margin:
                const EdgeInsets.only(

              bottom:
                  16,

            ),



            child:
            InkWell(


              onTap: () {


                Navigator.push(

                  context,


                  MaterialPageRoute(

                    builder: (context) =>

                        PropertyDetailsPage(

                          property:
                              property,

                        ),

                  ),

                );


              },



              child:
              Padding(


                padding:
                    const EdgeInsets.all(16),



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
                      const Icon(

                        Icons.home,

                        size:
                            60,

                      ),


                    ),





                    const SizedBox(
                      height: 12,
                    ),





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





                    const SizedBox(
                      height: 6,
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



                        Text(

                          property.location,

                        ),


                      ],

                    ),





                    const SizedBox(
                      height: 6,
                    ),





                    Text(


                       '₹${property.rent}/month'


                      style:
                      const TextStyle(

                        fontWeight:
                            FontWeight.bold,

                      ),


                    ),





                    const SizedBox(
                      height: 10,
                    ),





                    Row(


                      mainAxisAlignment:
                          MainAxisAlignment.end,



                      children: [



                        IconButton(


                          onPressed: () {


                            Navigator.push(

                              context,


                              MaterialPageRoute(

                                builder: (context) =>

                                    EditPropertyPage(

                                      property:
                                          property,

                                    ),

                              ),

                            );


                          },



                          icon:
                              const Icon(

                            Icons.edit,

                          ),


                        ),





                        IconButton(


                          onPressed: () async {

  final confirm =
      await showDialog<bool>(

    context: context,

    builder: (context) {

      return AlertDialog(

        title:
            const Text(
          'Delete Property',
        ),

        content:
            const Text(
          'Are you sure you want to delete this property?',
        ),

        actions: [

          TextButton(

            onPressed: () =>
                Navigator.pop(
                  context,
                  false,
                ),

            child:
                const Text(
              'Cancel',
            ),

          ),


          ElevatedButton(

            onPressed: () =>
                Navigator.pop(
                  context,
                  true,
                ),

            child:
                const Text(
              'Delete',
            ),

          ),

        ],

      );

    },

  );


  if (confirm == true) {

    await ref
        .read(ownerProvider.notifier)
        .deleteProperty(
          property.id,
        );

  }

},



                          icon:
                              const Icon(

                            Icons.delete,

                          ),


                        ),



                      ],

                    ),


                  ],


                ),

              ),

            ),

          );


        },

      ),

    );

  }

}
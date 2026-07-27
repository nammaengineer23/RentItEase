import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/favorites_provider.dart';
import '../widgets/favorite_property_card.dart';



class FavoritesPage extends ConsumerStatefulWidget {


  const FavoritesPage({

    super.key,

  });




  @override
  ConsumerState<FavoritesPage> createState() =>
      _FavoritesPageState();


}






class _FavoritesPageState
    extends ConsumerState<FavoritesPage> {



  @override
  void initState() {


    super.initState();



    Future.microtask(() {


      ref

          .read(
            favoritesProvider.notifier,
          )

          .loadFavorites();



    });


  }







  @override
  Widget build(
    BuildContext context,
  ) {


    final state =
        ref.watch(
          favoritesProvider,
        );





    return Scaffold(



      appBar: AppBar(


        title:
            const Text(
          'My Favorites ❤️',
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



      state.favorites.isEmpty



          ?



      const Center(


        child:
        Column(


          mainAxisAlignment:
              MainAxisAlignment.center,



          children: [



            Icon(

              Icons.favorite_border,

              size:
                  80,

            ),





            SizedBox(

              height:
                  15,

            ),





            Text(

              'No Favorite Properties',

              style:
              TextStyle(

                fontSize:
                    18,

              ),

            ),



          ],


        ),


      )



          :



      RefreshIndicator(



        onRefresh: () async {


          await ref

              .read(
                favoritesProvider.notifier,
              )

              .loadFavorites();


        },



        child:
        ListView.builder(



          padding:
              const EdgeInsets.all(16),





          itemCount:
              state.favorites.length,





          itemBuilder:
              (context,index) {



            final property =
                state.favorites[index];





            return FavoritePropertyCard(

              property:
                  property,

            );



          },


        ),


      ),



    );


  }



}
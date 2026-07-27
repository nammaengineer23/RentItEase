import '../models/favorite_property_model.dart';

import 'favorites_api.dart';



class FavoritesRepository {


  final FavoritesApi api;



  FavoritesRepository(

    this.api,

  );





  // ===============================
  // GET FAVORITES
  // ===============================



  Future<List<FavoritePropertyModel>>
      getFavorites() async {


    return await api.getFavorites();


  }








  // ===============================
  // ADD FAVORITE
  // ===============================



  Future<void>
      addFavorite(

    String propertyId,

  ) async {


    await api.addFavorite(

      propertyId,

    );


  }








  // ===============================
  // REMOVE FAVORITE
  // ===============================



  Future<void>
      removeFavorite(

    String propertyId,

  ) async {


    await api.removeFavorite(

      propertyId,

    );


  }



}
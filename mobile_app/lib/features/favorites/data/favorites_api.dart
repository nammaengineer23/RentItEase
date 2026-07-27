import 'package:dio/dio.dart';

import '../models/favorite_property_model.dart';



class FavoritesApi {


  final Dio dio;



  FavoritesApi(
    this.dio,
  );





  // ===============================
  // GET FAVORITE PROPERTIES
  // ===============================


  Future<List<FavoritePropertyModel>>
      getFavorites() async {


    try {


      final response =
          await dio.get(

        '/favorites',

      );



      final data =
          response.data;



      final list =
          data is List
              ? data
              : data['data'] ?? [];




      return list
          .map(

            (item) =>
                FavoritePropertyModel.fromJson(

                  item,

                ),

          )
          .toList();



    } on DioException catch(e) {


      throw Exception(

        e.response?.data ??
            'Failed to load favorites',

      );


    }


  }








  // ===============================
  // ADD FAVORITE
  // ===============================


  Future<void>
      addFavorite(

    String propertyId,

  ) async {


    try {


      await dio.post(

        '/favorites/$propertyId',

      );



    } on DioException catch(e) {


      throw Exception(

        e.response?.data ??
            'Failed to add favorite',

      );


    }


  }








  // ===============================
  // REMOVE FAVORITE
  // ===============================


  Future<void>
      removeFavorite(

    String propertyId,

  ) async {


    try {


      await dio.delete(

        '/favorites/$propertyId',

      );



    } on DioException catch(e) {


      throw Exception(

        e.response?.data ??
            'Failed to remove favorite',

      );


    }


  }



}
import 'package:dio/dio.dart';

import '../models/owner_property_model.dart';
import '../models/visit_request_model.dart';
import '../models/analytics_model.dart';



class OwnerApi {


  final Dio dio;



  OwnerApi(this.dio);





  // ================================
  // PROPERTY APIs
  // ================================



  Future<List<OwnerPropertyModel>>
      getMyProperties() async {


    try {


      final response =
          await dio.get(
        '/properties/my-properties',
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
                OwnerPropertyModel.fromJson(
                  item,
                ),

          )
          .toList();



    } on DioException catch(e) {


      throw Exception(
        e.response?.data ??
            'Failed to load properties',
      );


    }

  }








  Future<OwnerPropertyModel>
      createProperty(

    Map<String,dynamic> payload,

  ) async {



    try {


      final response =
          await dio.post(

        '/properties',

        data: payload,

      );



      return OwnerPropertyModel.fromJson(

        response.data,

      );



    } on DioException catch(e) {


      throw Exception(

        e.response?.data ??
            'Failed to create property',

      );


    }


  }








  Future<OwnerPropertyModel>
      updateProperty(

    String id,

    Map<String,dynamic> payload,

  ) async {



    try {


      final response =
          await dio.patch(

        '/properties/$id',

        data: payload,

      );



      return OwnerPropertyModel.fromJson(

        response.data,

      );



    } on DioException catch(e) {


      throw Exception(

        e.response?.data ??
            'Failed to update property',

      );


    }


  }








  Future<void> deleteProperty(

    String id,

  ) async {



    try {


      await dio.delete(

        '/properties/$id',

      );



    } on DioException catch(e) {


      throw Exception(

        e.response?.data ??
            'Failed to delete property',

      );


    }


  }








  // ================================
  // PROPERTY VISITS APIs
  // ================================




  Future<List<VisitRequestModel>>
      getOwnerVisits() async {



    try {


      final response =
          await dio.get(

        '/property-visits/owner',

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
                VisitRequestModel.fromJson(

                  item,

                ),

          )
          .toList();




    } on DioException catch(e) {



      throw Exception(

        e.response?.data ??
            'Failed to load visit requests',

      );



    }


  }








  Future<void> approveVisit(

    String id,

  ) async {


    try {


      await dio.patch(

        '/property-visits/$id/approve',

      );



    } on DioException catch(e) {


      throw Exception(

        e.response?.data ??
            'Failed to approve visit',

      );


    }


  }








  Future<void> rejectVisit(

    String id,

  ) async {



    try {


      await dio.patch(

        '/property-visits/$id/reject',

      );



    } on DioException catch(e) {


      throw Exception(

        e.response?.data ??
            'Failed to reject visit',

      );


    }


  }








  Future<void> completeVisit(

    String id,

  ) async {



    try {


      await dio.patch(

        '/property-visits/$id/complete',

      );



    } on DioException catch(e) {


      throw Exception(

        e.response?.data ??
            'Failed to complete visit',

      );


    }


  }








  // ================================
  // ANALYTICS API
  // ================================




  Future<AnalyticsModel>
      getAnalytics() async {



    try {


      final response =
          await dio.get(

        '/owner/analytics',

      );



      return AnalyticsModel.fromJson(

        response.data,

      );



    } on DioException catch(e) {


      throw Exception(

        e.response?.data ??
            'Failed to load analytics',

      );


    }


  }


}
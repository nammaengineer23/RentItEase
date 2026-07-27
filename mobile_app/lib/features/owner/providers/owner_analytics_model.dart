class OwnerAnalyticsModel {


  final int totalViews;

  final int totalFavorites;

  final int totalVisits;

  final int totalProperties;



  OwnerAnalyticsModel({

    required this.totalViews,

    required this.totalFavorites,

    required this.totalVisits,

    required this.totalProperties,

  });




  factory OwnerAnalyticsModel.fromJson(
      Map<String, dynamic> json,
      ) {


    return OwnerAnalyticsModel(

      totalViews:
          json['totalViews'] ?? 0,


      totalFavorites:
          json['totalFavorites'] ?? 0,


      totalVisits:
          json['totalVisits'] ?? 0,


      totalProperties:
          json['totalProperties'] ?? 0,


    );


  }





  Map<String, dynamic> toJson() {


    return {


      'totalViews':
          totalViews,


      'totalFavorites':
          totalFavorites,


      'totalVisits':
          totalVisits,


      'totalProperties':
          totalProperties,


    };


  }


}
class AnalyticsModel {
  final int totalProperties;
  final int totalViews;
  final int totalFavorites;
  final int totalVisits;


  AnalyticsModel({

    required this.totalProperties,

    required this.totalViews,

    required this.totalFavorites,

    required this.totalVisits,

  });



  factory AnalyticsModel.fromJson(
    Map<String, dynamic> json,
  ) {

    return AnalyticsModel(

      totalProperties:
          json['totalProperties'] ?? 0,


      totalViews:
          json['totalViews'] ?? 0,


      totalFavorites:
          json['totalFavorites'] ?? 0,


      totalVisits:
          json['totalVisits'] ?? 0,

    );
  }



  Map<String, dynamic> toJson() {

    return {

      'totalProperties':
          totalProperties,


      'totalViews':
          totalViews,


      'totalFavorites':
          totalFavorites,


      'totalVisits':
          totalVisits,

    };
  }
}
import '../models/owner_property_model.dart';
import '../models/property_visit_model.dart';

import 'owner_analytics_model.dart';



class OwnerState {


  final List<OwnerPropertyModel> properties;


  final List<PropertyVisitModel> visits;


  final OwnerAnalyticsModel? analytics;


  final bool isLoading;


  final String? error;




  const OwnerState({

    this.properties = const [],

    this.visits = const [],

    this.analytics,

    this.isLoading = false,

    this.error,

  });






  OwnerState copyWith({


    List<OwnerPropertyModel>? properties,


    List<PropertyVisitModel>? visits,


    OwnerAnalyticsModel? analytics,


    bool? isLoading,


    String? error,


  }) {


    return OwnerState(


      properties:
          properties ?? this.properties,


      visits:
          visits ?? this.visits,


      analytics:
          analytics ?? this.analytics,


      isLoading:
          isLoading ?? this.isLoading,


      error:
          error ?? this.error,


    );


  }


}
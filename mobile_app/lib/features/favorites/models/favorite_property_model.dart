class FavoritePropertyModel {


  final String id;

  final String propertyId;

  final String title;

  final String description;

  final String propertyType;

  final String bhk;

  final double rent;

  final double deposit;

  final String location;

  final String address;

  final String? imageUrl;



  FavoritePropertyModel({

    required this.id,

    required this.propertyId,

    required this.title,

    required this.description,

    required this.propertyType,

    required this.bhk,

    required this.rent,

    required this.deposit,

    required this.location,

    required this.address,

    this.imageUrl,

  });





  factory FavoritePropertyModel.fromJson(

    Map<String, dynamic> json,

  ) {


    final property =
        json['property'] ?? json;



    return FavoritePropertyModel(


      id:
          json['id'] ?? '',



      propertyId:
          property['id'] ?? '',



      title:
          property['title'] ?? '',



      description:
          property['description'] ?? '',



      propertyType:
          property['propertyType'] ?? '',



      bhk:
          property['bhk'] ?? '',



      rent:
          (property['rent'] ?? 0)
              .toDouble(),



      deposit:
          (property['deposit'] ?? 0)
              .toDouble(),



      location:
          property['location'] ?? '',



      address:
          property['address'] ?? '',



      imageUrl:
          property['imageUrl'],

    );

  }






  Map<String,dynamic> toJson(){


    return {


      'id':
          id,


      'propertyId':
          propertyId,


      'title':
          title,


      'description':
          description,


      'propertyType':
          propertyType,


      'bhk':
          bhk,


      'rent':
          rent,


      'deposit':
          deposit,


      'location':
          location,


      'address':
          address,


      'imageUrl':
          imageUrl,


    };


  }



}
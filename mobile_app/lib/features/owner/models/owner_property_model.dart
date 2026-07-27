class OwnerPropertyModel {
  final String id;
  final String title;
  final String description;
  final String propertyType;
  final String bhk;
  final double rent;
  final double deposit;
  final String location;
  final String address;
  final List<String> images;
  final bool isAvailable;
  final DateTime createdAt;


  OwnerPropertyModel({

    required this.id,

    required this.title,

    required this.description,

    required this.propertyType,

    required this.bhk,

    required this.rent,

    required this.deposit,

    required this.location,

    required this.address,

    required this.images,

    required this.isAvailable,

    required this.createdAt,

  });



  factory OwnerPropertyModel.fromJson(
      Map<String, dynamic> json,
  ) {

    return OwnerPropertyModel(

      id: json['id'] ?? '',


      title: json['title'] ?? '',


      description:
          json['description'] ?? '',


      propertyType:
          json['propertyType'] ?? '',


      bhk:
          json['bhk'] ?? '',


      rent:
          (json['rent'] ?? 0)
              .toDouble(),


      deposit:
          (json['deposit'] ?? 0)
              .toDouble(),


      location:
          json['location'] ?? '',


      address:
          json['address'] ?? '',


      images:
          json['images'] != null
              ? List<String>.from(
                  json['images'],
                )
              : [],


      isAvailable:
          json['isAvailable'] ?? true,


      createdAt:
          json['createdAt'] != null
              ? DateTime.parse(
                  json['createdAt'],
                )
              : DateTime.now(),

    );
  }



  Map<String, dynamic> toJson() {

    return {

      'id': id,

      'title': title,

      'description': description,

      'propertyType': propertyType,

      'bhk': bhk,

      'rent': rent,

      'deposit': deposit,

      'location': location,

      'address': address,

      'images': images,

      'isAvailable': isAvailable,

      'createdAt':
          createdAt.toIso8601String(),

    };
  }
}
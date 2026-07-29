import '../../domain/entities/property_visit.dart';
import '../../domain/repositories/property_visit_repository.dart';
import '../models/property_visit_model.dart';

class PropertyVisitRepositoryImpl implements PropertyVisitRepository {
  final List<PropertyVisitModel> _dummyVisits = [
    PropertyVisitModel(
      id: '1',

      propertyId: 'property_001',

      propertyTitle: '2 BHK Apartment',

      propertyImage: 'https://picsum.photos/300/200',

      ownerId: 'owner_1',

      ownerName: 'Rahul Sharma',

      tenantId: 'tenant_1',

      tenantName: 'Shrikant',

      visitDate: DateTime.now().add(const Duration(days: 2)),

      status: 'PENDING',

      notes: 'Please call before visit.',
    ),

    PropertyVisitModel(
      id: '2',

      propertyId: 'property_002',

      propertyTitle: '3 BHK Villa',

      propertyImage: 'https://picsum.photos/301/200',

      ownerId: 'owner_2',

      ownerName: 'Anita',

      tenantId: 'tenant_1',

      tenantName: 'Shrikant',

      visitDate: DateTime.now().add(const Duration(days: 5)),

      status: 'APPROVED',
    ),
  ];

  @override
  Future<List<PropertyVisit>> getMyVisits() async {
    await Future.delayed(const Duration(milliseconds: 500));

    return _dummyVisits;
  }

  @override
  Future<List<PropertyVisit>> getOwnerVisits() async {
    await Future.delayed(const Duration(milliseconds: 500));

    return _dummyVisits;
  }

  @override
  Future<void> bookVisit({
    required String propertyId,
    required DateTime visitDate,
    String? notes,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));
  }

  @override
  Future<void> cancelVisit(String visitId) async {
    await Future.delayed(const Duration(milliseconds: 400));
  }

  @override
  Future<void> approveVisit(String visitId) async {
    await Future.delayed(const Duration(milliseconds: 400));
  }

  @override
  Future<void> rejectVisit(String visitId) async {
    await Future.delayed(const Duration(milliseconds: 400));
  }

  @override
  Future<void> completeVisit(String visitId) async {
    await Future.delayed(const Duration(milliseconds: 400));
  }
}

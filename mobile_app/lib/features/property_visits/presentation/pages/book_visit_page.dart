import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/property_visit_provider.dart';
import '../../../property/providers/property_provider.dart';
import '../widgets/visit_date_picker.dart';

class BookVisitPage extends ConsumerStatefulWidget {
  const BookVisitPage({
    super.key,
    required this.propertyId,
    required this.propertyTitle,
    required this.propertyImage,
    required this.ownerName,
  });

  final String propertyId;
  final String propertyTitle;
  final String propertyImage;
  final String ownerName;

  @override
  ConsumerState<BookVisitPage> createState() => _BookVisitPageState();
}

class _BookVisitPageState extends ConsumerState<BookVisitPage> {
  final TextEditingController notesController =
      TextEditingController();

  DateTime? visitDate;

  bool loading = false;
  late String propertyTitle;
  late String propertyImage;

  @override
  void initState() {
    super.initState();
    propertyTitle = widget.propertyTitle;
    propertyImage = widget.propertyImage;
    if (propertyTitle.isEmpty || propertyImage.isEmpty) {
      Future.microtask(_loadPropertySummary);
    }
  }

  Future<void> _loadPropertySummary() async {
    if (widget.propertyId.trim().isEmpty) return;
    try {
      final property = await ref
          .read(propertyProvider.notifier)
          .getProperty(widget.propertyId);
      if (!mounted) return;
      setState(() {
        propertyTitle = property.title;
        propertyImage = property.imageUrls.isNotEmpty
            ? property.imageUrls.first
            : '';
      });
    } catch (_) {
      // The API still validates the property ID when the summary cannot load.
    }
  }

  Future<void> bookVisit() async {
    final selectedVisitDate = visitDate;

    if (widget.propertyId.trim().isEmpty) {
      _showMessage('Property information is missing.');
      return;
    }

    if (selectedVisitDate == null) {
      _showMessage(
        'Please select a visit date and time.',
      );
      return;
    }

    if (!selectedVisitDate.isAfter(DateTime.now())) {
      _showMessage(
        'Please select a future date and time.',
      );
      return;
    }

    if (loading) {
      return;
    }

    setState(() {
      loading = true;
    });

    try {
      await ref
          .read(propertyVisitProvider.notifier)
          .bookVisit(
            propertyId: widget.propertyId,
            visitDate: selectedVisitDate,
            notes: notesController.text.trim().isEmpty
                ? null
                : notesController.text.trim(),
          );

      if (!mounted) {
        return;
      }

      _showMessage(
        'Visit booked successfully.',
      );

      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) {
        return;
      }

      _showMessage(
        _getErrorMessage(error),
      );
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
        });
      }
    }
  }

  String _getErrorMessage(Object error) {
    if (error is DioException) {
      final responseData = error.response?.data;

      if (responseData is Map) {
        final message = responseData['message'];

        if (message is List && message.isNotEmpty) {
          return message.join(', ');
        }

        if (message != null &&
            message.toString().trim().isNotEmpty) {
          return message.toString();
        }
      }

      switch (error.response?.statusCode) {
        case 401:
          return 'Please log in again to book a visit.';

        case 403:
          return 'You are not authorized to book this visit.';

        case 404:
          return 'Property not found.';

        case 409:
          return 'This time slot is already booked.';

        case 500:
          return 'Server error. Please try again later.';
      }

      if (error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.sendTimeout) {
        return 'Unable to connect to the server. Please check your internet connection.';
      }
    }

    final message = error.toString();

    if (message.contains('already booked')) {
      return 'This time slot is already booked. Please choose another time.';
    }

    if (message.contains('not available')) {
      return 'This property is not currently available for visits.';
    }

    if (message.contains('future')) {
      return 'Please select a future date and time.';
    }

    return 'Unable to book the visit. Please try again.';
  }

  void _showMessage(String message) {
    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(context).hideCurrentSnackBar();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
      ),
    );
  }

  @override
  void dispose() {
    notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Property Visit'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment:
                CrossAxisAlignment.start,
            children: [
              // ==================================================
              // Property Summary
              // ==================================================

              Card(
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    AspectRatio(
                      aspectRatio: 16 / 9,
                      child: propertyImage.isEmpty
                          ? _buildPlaceholderImage()
                          : Image.network(
                              propertyImage,
                              fit: BoxFit.cover,
                              errorBuilder:
                                  (_, _, _) =>
                                      _buildPlaceholderImage(),
                            ),
                    ),

                    Padding(
                      padding:
                          const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          Text(
                            propertyTitle.isEmpty
                                ? 'Selected property'
                                : propertyTitle,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight:
                                  FontWeight.bold,
                            ),
                          ),

                          const SizedBox(height: 10),

                          Row(
                            children: [
                              const Icon(Icons.person),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  widget.ownerName.isEmpty
                                      ? 'Property Owner'
                                      : widget.ownerName,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 25),

              // ==================================================
              // Visit Date / Time
              // ==================================================

              VisitDatePicker(
                onChanged: (date) {
                  if (loading) {
                    return;
                  }

                  setState(() {
                    visitDate = date;
                  });
                },
              ),

              const SizedBox(height: 25),

              // ==================================================
              // Notes
              // ==================================================

              TextField(
                controller: notesController,
                maxLines: 4,
                maxLength: 500,
                enabled: !loading,
                decoration:
                    const InputDecoration(
                  labelText: 'Notes (Optional)',
                  hintText:
                      'Preferred time, instructions...',
                  border: OutlineInputBorder(),
                ),
              ),

              const SizedBox(height: 35),

              // ==================================================
              // Book Button
              // ==================================================

              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton.icon(
                  onPressed:
                      loading ? null : bookVisit,
                  icon: loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child:
                              CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(
                          Icons.calendar_month,
                        ),
                  label: Text(
                    loading
                        ? 'Booking...'
                        : 'Book Visit',
                  ),
                ),
              ),

              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      color: Colors.grey.shade300,
      child: const Center(
        child: Icon(
          Icons.home,
          size: 70,
        ),
      ),
    );
  }
}

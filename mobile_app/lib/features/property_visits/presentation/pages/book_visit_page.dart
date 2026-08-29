import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
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
      _showMessage(context.tr('propertyMissing'));
      return;
    }

    if (selectedVisitDate == null) {
      _showMessage(
        context.tr('selectVisitDate'),
      );
      return;
    }

    if (!selectedVisitDate.isAfter(DateTime.now())) {
      _showMessage(
        context.tr('selectFutureDate'),
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
        context.tr('visitBooked'),
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
          return context.tr('loginAgainVisit');

        case 403:
          return context.tr('notAuthorizedVisit');

        case 404:
          return context.tr('propertyNotFound');

        case 409:
          return context.tr('slotAlreadyBooked');

        case 500:
          return context.tr('serverTryLater');
      }

      if (error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.sendTimeout) {
        return context.tr('serverConnectionFailed');
      }
    }

    final message = error.toString();

    if (message.contains('already booked')) {
      return context.tr('chooseAnotherTime');
    }

    if (message.contains('not available')) {
      return context.tr('propertyUnavailableVisits');
    }

    if (message.contains('future')) {
      return context.tr('selectFutureDate');
    }

    return context.tr('bookVisitFailed');
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
        title: Text(context.tr('bookPropertyVisit')),
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
                                ? context.tr('selectedProperty')
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
                                      ? context.tr('propertyOwner')
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
                decoration: InputDecoration(
                  labelText: context.tr('notesOptional'),
                  hintText: context.tr('notesHint'),
                  border: const OutlineInputBorder(),
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
                        ? context.tr('booking')
                        : context.tr('bookVisit'),
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

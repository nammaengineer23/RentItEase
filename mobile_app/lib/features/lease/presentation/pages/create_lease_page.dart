import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/dio_provider.dart';
import '../../../../shared/widgets/primary_button.dart';

class CreateLeasePage extends ConsumerStatefulWidget {
  const CreateLeasePage({super.key, required this.bookingId});

  final String bookingId;

  @override
  ConsumerState<CreateLeasePage> createState() => _CreateLeasePageState();
}

class _CreateLeasePageState extends ConsumerState<CreateLeasePage> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  DateTime _startDate = DateTime.now();
  DateTime? _endDate;
  bool _submitting = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isStartDate}) async {
    final initialDate = isStartDate ? _startDate : (_endDate ?? _startDate);
    final selected = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: isStartDate ? DateTime.now() : _startDate.add(const Duration(days: 1)),
      lastDate: DateTime(DateTime.now().year + 10),
    );
    if (selected == null || !mounted) return;
    setState(() {
      if (isStartDate) {
        _startDate = selected;
        if (_endDate != null && !_endDate!.isAfter(selected)) _endDate = null;
      } else {
        _endDate = selected;
      }
    });
  }

  Future<void> _createLease() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      await ref.read(dioProvider).post('/leases', data: {
        'bookingId': widget.bookingId,
        'startDate': _startDate.toUtc().toIso8601String(),
        if (_endDate != null) 'endDate': _endDate!.toUtc().toIso8601String(),
        if (_notesController.text.trim().isNotEmpty)
          'notes': _notesController.text.trim(),
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lease created successfully.')),
      );
      context.go('/my-bookings');
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Unable to create the lease. Please try again.'),
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final startLabel = MaterialLocalizations.of(context).formatMediumDate(_startDate);
    final endLabel = _endDate == null
        ? 'No end date'
        : MaterialLocalizations.of(context).formatMediumDate(_endDate!);
    return Scaffold(
      appBar: AppBar(title: const Text('Create Lease')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              const Text(
                'Create a lease after your booking payment is confirmed.',
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 24),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Lease start date'),
                subtitle: Text(startLabel),
                trailing: const Icon(Icons.calendar_today_outlined),
                onTap: () => _pickDate(isStartDate: true),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Lease end date'),
                subtitle: Text(endLabel),
                trailing: const Icon(Icons.calendar_today_outlined),
                onTap: () => _pickDate(isStartDate: false),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _notesController,
                maxLines: 4,
                maxLength: 500,
                decoration: const InputDecoration(
                  labelText: 'Notes (optional)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 24),
              PrimaryButton(
                label: _submitting ? 'Creating Lease...' : 'Create Lease',
                onPressed: _submitting ? null : _createLease,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

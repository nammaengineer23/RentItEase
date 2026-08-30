import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../../../core/network/dio_provider.dart';

class PremiumMembershipPage extends ConsumerStatefulWidget {
  const PremiumMembershipPage({super.key});

  @override
  ConsumerState<PremiumMembershipPage> createState() =>
      _PremiumMembershipPageState();
}

class _PremiumMembershipPageState
    extends ConsumerState<PremiumMembershipPage> {
  late final Razorpay _razorpay;
  bool _loading = true;
  bool _processing = false;
  List<Map<String, dynamic>> _memberships = const [];
  Map<String, dynamic>? _pendingCheckout;
  String? _pendingMembershipId;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay()
      ..on(Razorpay.EVENT_PAYMENT_SUCCESS, _handleSuccess)
      ..on(Razorpay.EVENT_PAYMENT_ERROR, _handleError)
      ..on(Razorpay.EVENT_EXTERNAL_WALLET, _handleWallet);
    _load();
  }

  dynamic _unwrap(dynamic value) {
    while (value is Map && value.containsKey('data')) {
      value = value['data'];
    }
    return value;
  }

  Future<void> _load() async {
    try {
      final response = await ref.read(dioProvider).get('/membership/me');
      final value = _unwrap(response.data);
      if (!mounted) return;
      setState(() {
        _memberships = value is List
            ? value.whereType<Map>().map(Map<String, dynamic>.from).toList()
            : const [];
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _loading = false);
      _show('Unable to load premium membership: $error');
    }
  }

  Future<void> _requestPremium() async {
    if (_processing) return;
    setState(() => _processing = true);
    try {
      final response = await ref
          .read(dioProvider)
          .post('/membership/me/premium/request');
      final data = _unwrap(response.data);
      if (data is! Map) throw const FormatException('Invalid membership response');
      final result = Map<String, dynamic>.from(data);
      final membership = result['membership'];
      if (membership is Map) {
        _pendingMembershipId = membership['id']?.toString();
      }

      if (result['trialGranted'] == true || result['requiresPayment'] != true) {
        _show(
          result['trialGranted'] == true
              ? 'Your first 30 days of Premium are free and active now.'
              : 'Premium membership is already active.',
        );
        await _load();
        return;
      }

      final checkout = result['checkout'];
      if (checkout is! Map) throw const FormatException('Checkout unavailable');
      _pendingCheckout = Map<String, dynamic>.from(checkout);
      final customer = checkout['customer'] is Map
          ? Map<String, dynamic>.from(checkout['customer'] as Map)
          : const <String, dynamic>{};
      _razorpay.open({
        'key': checkout['keyId'],
        'amount': checkout['amountInPaise'],
        'currency': 'INR',
        'name': 'RentItEase',
        'description': 'Premium Membership - 30 days',
        'order_id': checkout['razorpayOrderId'],
        'prefill': {
          'name': customer['fullName'] ?? '',
          'email': customer['email'] ?? '',
          'contact': customer['phone'] ?? '',
        },
        'theme': {'color': '#2E7D4F'},
      });
    } catch (error) {
      _show('Unable to start Premium membership: $error');
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  Future<void> _handleSuccess(PaymentSuccessResponse response) async {
    final membershipId = _pendingMembershipId;
    final checkout = _pendingCheckout;
    if (membershipId == null || checkout == null) {
      _show('Premium payment information is incomplete.');
      return;
    }
    setState(() => _processing = true);
    try {
      await ref.read(dioProvider).post(
        '/membership/me/premium/verify',
        data: {
          'membershipId': membershipId,
          'razorpayOrderId': response.orderId ?? checkout['razorpayOrderId'],
          'razorpayPaymentId': response.paymentId,
          'razorpaySignature': response.signature,
        },
      );
      _show('Payment verified. Premium is active for 30 days.');
      await _load();
    } catch (error) {
      _show('Unable to verify Premium payment: $error');
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  void _handleError(PaymentFailureResponse response) {
    _show(response.message ?? 'Premium payment was not completed.');
  }

  void _handleWallet(ExternalWalletResponse response) {
    _show('External wallet selected: ${response.walletName ?? ''}');
  }

  Future<void> _downloadInvoice(String membershipId) async {
    try {
      final response = await ref
          .read(dioProvider)
          .get('/invoices/membership/$membershipId');
      final value = _unwrap(response.data);
      if (value is! Map) throw const FormatException('Invalid invoice response');
      final invoice = Map<String, dynamic>.from(value);
      final directory = await getDownloadsDirectory() ??
          await getApplicationDocumentsDirectory();
      final number = invoice['invoiceNumber']?.toString() ?? membershipId;
      final file = File('${directory.path}/$number.html');
      await file.writeAsString('''<!doctype html>
<html><head><meta charset="utf-8"><title>RentItEase Premium Invoice</title></head>
<body style="font-family:Arial;padding:32px">
<h1>RentItEase</h1><h2>Premium Membership Invoice</h2>
<p><strong>Invoice:</strong> $number</p>
<p><strong>Membership:</strong> $membershipId</p>
<p><strong>Date:</strong> ${invoice['invoiceDate'] ?? ''}</p>
<p><strong>Status:</strong> ${invoice['status'] ?? ''}</p>
<p><strong>Total:</strong> INR ${invoice['totalAmount'] ?? 0}</p>
<p>${invoice['description'] ?? ''}</p>
</body></html>''');
      _show('Invoice downloaded to ${file.path}');
    } catch (error) {
      _show('Unable to download Premium invoice: $error');
    }
  }

  void _show(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Map<String, dynamic>? active;
    for (final membership in _memberships) {
      if (membership['status'] == 'ACTIVE') {
        active = membership;
        break;
      }
    }
    final activeMembership = active;
    final hasTrial = _memberships.any((item) => item['isTrial'] == true);

    return Scaffold(
      appBar: AppBar(title: const Text('Premium Membership')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.workspace_premium, size: 34),
                              SizedBox(width: 12),
                              Text(
                                'RentItEase Premium',
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            '₹99 for 30 days',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            hasTrial
                                ? 'Your one-time free trial has been used.'
                                : 'Your first 30 days are free when you request Premium.',
                          ),
                          const SizedBox(height: 16),
                          const Text('• View protected owner contact details'),
                          const Text('• Access Premium-only properties'),
                          const Text('• Receive a downloadable purchase invoice'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (activeMembership != null)
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.verified, color: Colors.green),
                        title: const Text('Premium active'),
                        subtitle: Text(
                          'Valid until ${activeMembership['endDate'] ?? ''}',
                        ),
                        trailing: IconButton(
                          tooltip: 'Download invoice',
                          onPressed: () => _downloadInvoice(
                            activeMembership['id'].toString(),
                          ),
                          icon: const Icon(Icons.download),
                        ),
                      ),
                    )
                  else
                    FilledButton.icon(
                      onPressed: _processing ? null : _requestPremium,
                      icon: _processing
                          ? const SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.workspace_premium_outlined),
                      label: Text(
                        hasTrial ? 'Buy Premium for ₹99' : 'Start 30-Day Free Trial',
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}

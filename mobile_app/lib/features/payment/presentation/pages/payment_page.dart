import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../../../shared/widgets/primary_button.dart';
import '../../domain/entities/payment_entity.dart';
import '../../providers/payment_provider.dart';
import '../../widgets/payment_card.dart';
import '../../../../core/network/dio_provider.dart';

class PaymentPage extends ConsumerStatefulWidget {
  const PaymentPage({super.key, required this.bookingId});

  final String bookingId;

  @override
  ConsumerState<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends ConsumerState<PaymentPage> {
  late final Razorpay _razorpay;

  PaymentEntity? _payment;

  bool _isLoading = true;
  bool _isVerifying = false;

  String? _errorMessage;

  @override
  void initState() {
    super.initState();

    _razorpay = Razorpay();

    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);

    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);

    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);

    _loadPaymentOrder();
  }

  Future<void> _loadPaymentOrder() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      final payment = await ref.read(
        paymentOrderProvider(widget.bookingId).future,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _payment = payment;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _isLoading = false;
        _errorMessage = _errorMessageFrom(error);
      });
    }
  }

  void _openCheckout() {
    final payment = _payment;

    if (payment == null) {
      return;
    }

    final keyId = payment.keyId;

    if (keyId == null || keyId.isEmpty) {
      _showError('Razorpay key is not configured.');
      return;
    }

    final options = {
      'key': keyId,
      'amount': payment.amountInPaise,
      'currency': payment.currency,
      'name': 'RentItEase',
      'description': 'Booking payment',
      'order_id': payment.razorpayOrderId,
      'prefill': {
        if (payment.customerName != null) 'name': payment.customerName,
        if (payment.customerEmail != null) 'email': payment.customerEmail,
        if (payment.customerPhone != null) 'contact': payment.customerPhone,
      },
      'theme': {'color': '#1976D2'},
    };

    try {
      _razorpay.open(options);
    } catch (error) {
      _showError('Unable to open Razorpay checkout.');
    }
  }

  Future<void> _handlePaymentSuccess(PaymentSuccessResponse response) async {
    final orderId = response.orderId;
    final paymentId = response.paymentId;
    final signature = response.signature;

    if (orderId == null || paymentId == null || signature == null) {
      _showError('Razorpay returned incomplete payment information.');
      return;
    }

    try {
      setState(() {
        _isVerifying = true;
        _errorMessage = null;
      });

      final repository = ref.read(paymentRepositoryProvider);

      final verifiedPayment = await repository.verifyPayment(
        bookingId: widget.bookingId,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _payment = verifiedPayment;
        _isVerifying = false;
      });

      await _showPaymentSuccess();
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _isVerifying = false;
        _errorMessage = _errorMessageFrom(error);
      });

      _showError(_errorMessage ?? 'Payment verification failed.');
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (!mounted) {
      return;
    }

    setState(() {
      _isVerifying = false;
      _errorMessage = response.message ?? 'Payment failed.';
    });

    _showError(response.message ?? 'Payment failed.');
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'External wallet selected: '
          '${response.walletName ?? 'Unknown'}',
        ),
      ),
    );
  }

  Future<void> _showPaymentSuccess() async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: Colors.green),
              SizedBox(width: 10),
              Text('Payment Successful'),
            ],
          ),
          content: const Text(
            'Your booking payment has been verified successfully.',
          ),
          actions: [
            FilledButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Done'),
            ),
          ],
        );
      },
    );
  }

  void _showError(String message) {
    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _downloadInvoice() async {
    try {
      final response = await ref
          .read(dioProvider)
          .get('/invoices/booking/${widget.bookingId}');
      dynamic payload = response.data;
      if (payload is Map && payload['data'] is Map) payload = payload['data'];
      if (payload is! Map) throw Exception('Invalid invoice response.');

      final invoice = Map<String, dynamic>.from(payload);
      final directory = await getDownloadsDirectory() ??
          await getApplicationDocumentsDirectory();
      final number = invoice['invoiceNumber']?.toString() ?? widget.bookingId;
      final file = File('${directory.path}/$number.html');
      final amount = invoice['totalAmount']?.toString() ?? '0';
      final date = invoice['invoiceDate']?.toString() ?? '';
      await file.writeAsString('''<!doctype html>
<html><head><meta charset="utf-8"><title>RentItEase Invoice</title></head>
<body style="font-family:Arial;padding:32px">
<h1>RentItEase</h1><h2>Payment Invoice</h2>
<p><strong>Invoice:</strong> $number</p>
<p><strong>Booking:</strong> ${widget.bookingId}</p>
<p><strong>Date:</strong> $date</p>
<p><strong>Status:</strong> ${invoice['status']}</p>
<p><strong>Total:</strong> INR $amount</p>
<p>${invoice['description'] ?? ''}</p>
</body></html>''');

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Invoice downloaded to ${file.path}')),
      );
    } catch (error) {
      _showError('Invoice is available only after completed payment: $error');
    }
  }

  String _errorMessageFrom(Object error) {
    final text = error.toString();

    if (text.startsWith('Exception: ')) {
      return text.substring('Exception: '.length);
    }

    return text;
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payment')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null && _payment == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 56),
              const SizedBox(height: 16),
              Text(_errorMessage!, textAlign: TextAlign.center),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _loadPaymentOrder,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final payment = _payment;

    if (payment == null) {
      return const Center(child: Text('Payment information unavailable.'));
    }

    final isPaid = payment.status.toUpperCase() == 'SUCCESS';

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 8),
            Icon(
              isPaid
                  ? Icons.check_circle_outline
                  : Icons.account_balance_wallet_outlined,
              size: 64,
              color: isPaid
                  ? Colors.green
                  : Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text(
              isPaid ? 'Payment Completed' : 'Complete Your Payment',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              isPaid
                  ? 'Your booking payment has been verified.'
                  : 'Pay the rent and security deposit to complete your booking.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            PaymentCard(payment: payment),
            if (!isPaid) ...[
              const SizedBox(height: 20),
              Text(
                'Payment options',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              const Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Chip(avatar: Icon(Icons.account_balance, size: 18), label: Text('UPI')),
                  Chip(avatar: Icon(Icons.credit_card, size: 18), label: Text('Cards')),
                  Chip(avatar: Icon(Icons.account_balance_wallet, size: 18), label: Text('Wallets')),
                  Chip(avatar: Icon(Icons.business, size: 18), label: Text('Netbanking')),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'The secure Razorpay checkout will show the payment methods available for your bank and device.',
              ),
            ],
            const Spacer(),
            if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  _errorMessage!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            if (!isPaid)
              PrimaryButton(
                label: _isVerifying
                    ? 'Verifying Payment...'
                    : 'Pay ₹${payment.amount.toStringAsFixed(2)}',
                onPressed: _isVerifying ? null : _openCheckout,
              ),
            if (isPaid)
              PrimaryButton(
                label: 'Download Invoice',
                onPressed: _downloadInvoice,
              ),
          ],
        ),
      ),
    );
  }
}

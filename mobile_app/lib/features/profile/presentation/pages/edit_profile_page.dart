import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/profile_provider.dart';

class EditProfilePage extends ConsumerStatefulWidget {
  const EditProfilePage({super.key});

  @override
  ConsumerState<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends ConsumerState<EditProfilePage> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController nameController;

  late TextEditingController phoneController;

  bool isSaving = false;

  @override
  void initState() {
    super.initState();

    final profile = ref.read(profileProvider).value;

    nameController = TextEditingController(text: profile?.fullName ?? '');

    phoneController = TextEditingController(text: profile?.phone ?? '');
  }

  String? validateRequired(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }

    return null;
  }

  Future<void> saveProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      isSaving = true;
    });

    try {
      await ref
          .read(profileProvider.notifier)
          .updateProfile(
            fullName: nameController.text.trim(),

            phone: phoneController.text.trim(),
          );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully')),
      );

      Navigator.pop(context);
    } catch (e) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) {
        setState(() {
          isSaving = false;
        });
      }
    }
  }

  @override
  void dispose() {
    nameController.dispose();

    phoneController.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),

      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),

        child: Form(
          key: _formKey,

          child: Column(
            children: [
              CircleAvatar(
                radius: 50,

                child: const Icon(Icons.person, size: 50),
              ),

              const SizedBox(height: 30),

              TextFormField(
                controller: nameController,

                validator: validateRequired,

                decoration: const InputDecoration(
                  labelText: 'Full Name',

                  border: OutlineInputBorder(),

                  prefixIcon: Icon(Icons.person),
                ),
              ),

              const SizedBox(height: 20),

              TextFormField(
                controller: phoneController,

                validator: validateRequired,

                keyboardType: TextInputType.phone,

                decoration: const InputDecoration(
                  labelText: 'Phone Number',

                  border: OutlineInputBorder(),

                  prefixIcon: Icon(Icons.phone),
                ),
              ),

              const SizedBox(height: 30),

              SizedBox(
                width: double.infinity,

                height: 50,

                child: ElevatedButton(
                  onPressed: isSaving ? null : saveProfile,

                  child: isSaving
                      ? const SizedBox(
                          height: 22,

                          width: 22,

                          child: CircularProgressIndicator(
                            strokeWidth: 2,

                            color: Colors.white,
                          ),
                        )
                      : const Text('Save Changes'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

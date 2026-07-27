import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/owner_provider.dart';
class AddPropertyPage extends ConsumerStatefulWidget {
    const AddPropertyPage({super.key});

  @override
ConsumerState<AddPropertyPage> createState()
      _AddPropertyPageState();
}


class _AddPropertyPageState
    extends ConsumerState<AddPropertyPage> {

  final titleController =
      TextEditingController();

  final descriptionController =
      TextEditingController();

  final rentController =
      TextEditingController();

  final depositController =
      TextEditingController();

  final locationController =
      TextEditingController();

  final addressController =
      TextEditingController();


  String propertyType = 'Apartment';

  String bhk = '1 BHK';



  @override
  Widget build(BuildContext context) {

    return Scaffold(

      appBar: AppBar(
        title: const Text(
          'Add Property',
        ),
      ),


      body: SingleChildScrollView(

        padding:
            const EdgeInsets.all(16),


        child: Column(

          crossAxisAlignment:
              CrossAxisAlignment.start,


          children: [


            _textField(
              titleController,
              'Property Title',
              Icons.home,
            ),


            _textField(
              descriptionController,
              'Description',
              Icons.description,
              maxLines: 3,
            ),



            const SizedBox(height: 15),



            DropdownButtonFormField(

              value: propertyType,


              decoration:
                  const InputDecoration(

                labelText:
                    'Property Type',

                border:
                    OutlineInputBorder(),

              ),


              items: const [

                DropdownMenuItem(
                  value: 'Apartment',
                  child:
                      Text('Apartment'),
                ),

                DropdownMenuItem(
                  value: 'Villa',
                  child:
                      Text('Villa'),
                ),

                DropdownMenuItem(
                  value: 'House',
                  child:
                      Text('House'),
                ),

              ],


              onChanged: (value) {

                setState(() {

                  propertyType =
                      value.toString();

                });

              },

            ),



            const SizedBox(height: 15),



            DropdownButtonFormField(

              value: bhk,


              decoration:
                  const InputDecoration(

                labelText:
                    'BHK',

                border:
                    OutlineInputBorder(),

              ),


              items: const [

                DropdownMenuItem(
                  value: '1 BHK',
                  child:
                      Text('1 BHK'),
                ),

                DropdownMenuItem(
                  value: '2 BHK',
                  child:
                      Text('2 BHK'),
                ),

                DropdownMenuItem(
                  value: '3 BHK',
                  child:
                      Text('3 BHK'),
                ),

              ],


              onChanged: (value) {

                setState(() {

                  bhk =
                      value.toString();

                });

              },

            ),



            const SizedBox(height: 15),



            _textField(
              rentController,
              'Monthly Rent',
              Icons.currency_rupee,
              keyboard:
                  TextInputType.number,
            ),



            _textField(
              depositController,
              'Security Deposit',
              Icons.money,
              keyboard:
                  TextInputType.number,
            ),



            _textField(
              locationController,
              'Location',
              Icons.location_on,
            ),



            _textField(
              addressController,
              'Full Address',
              Icons.map,
              maxLines: 2,
            ),



            const SizedBox(height: 20),



            const Text(

              'Amenities',

              style: TextStyle(

                fontSize: 18,

                fontWeight:
                    FontWeight.bold,

              ),
            ),



            Wrap(

              spacing: 8,

              children: [

                _amenity(
                  'Parking',
                ),

                _amenity(
                  'Lift',
                ),

                _amenity(
                  'Security',
                ),

                _amenity(
                  'Water',
                ),

              ],
            ),



            const SizedBox(height: 25),



            SizedBox(

              width:
                  double.infinity,


              child:
                  ElevatedButton(


                onPressed: submitProperty,


                child:
                    const Text(

                  'Add Property',

                ),

              ),
            ),


          ],
        ),
      ),
    );

    Future<void> submitProperty() async {

  final data = {

    "title": titleController.text,

    "description":
        descriptionController.text,

    "propertyType":
        propertyType,

    "bhk":
        bhk,

    "rent":
        double.tryParse(
          rentController.text,
        ) ?? 0,

    "deposit":
        double.tryParse(
          depositController.text,
        ) ?? 0,

    "location":
        locationController.text,

    "address":
        addressController.text,

    "images": [],

    "isAvailable": true,

  };


  await ref
      .read(ownerProvider.notifier)
      .addProperty(data);



  if (mounted) {

    ScaffoldMessenger.of(context)
        .showSnackBar(

      const SnackBar(

        content:
            Text(
          'Property Added Successfully',
        ),

      ),

    );


    Navigator.pop(context);

  }

}

  }



  Widget _textField(

    TextEditingController controller,

    String label,

    IconData icon, {

    int maxLines = 1,

    TextInputType? keyboard,

  }) {


    return Padding(

      padding:
          const EdgeInsets.only(
            bottom: 15,
          ),


      child:
          TextField(

        controller:
            controller,


        maxLines:
            maxLines,


        keyboardType:
            keyboard,


        decoration:
            InputDecoration(

          labelText:
              label,


          prefixIcon:
              Icon(icon),


          border:
              const OutlineInputBorder(),

        ),

      ),
    );
  }



  Widget _amenity(
    String text,
  ) {


    return FilterChip(

      label:
          Text(text),


      selected:
          false,


      onSelected:
          (value) {},

    );
  }
}
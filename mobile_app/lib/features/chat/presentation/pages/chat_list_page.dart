import 'package:flutter/material.dart';

import '../widgets/conversation_tile.dart';
import 'chat_page.dart';

class ChatListPage extends StatefulWidget {
  const ChatListPage({super.key});

  @override
  State<ChatListPage> createState() => _ChatListPageState();
}

class _ChatListPageState extends State<ChatListPage> {
  final TextEditingController searchController = TextEditingController();

  final List<Map<String, dynamic>> conversations = [
    {
      "name": "Rahul Sharma",
      "property": "2 BHK Apartment, Whitefield",
      "message": "Yes, tomorrow at 10:30 AM works.",
      "time": "10:30 AM",
      "unread": 2,
      "online": true,
    },
    {
      "name": "Priya Verma",
      "property": "1 BHK Studio, Indiranagar",
      "message": "Thank you.",
      "time": "Yesterday",
      "unread": 0,
      "online": false,
    },
    {
      "name": "Amit Kumar",
      "property": "3 BHK Villa, Sarjapur",
      "message": "Can you share more photos?",
      "time": "Mon",
      "unread": 1,
      "online": true,
    },
  ];

  String search = '';

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = conversations.where((chat) {
      return chat["name"].toString().toLowerCase().contains(
        search.toLowerCase(),
      );
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text("Chats"),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() {});
            },
          ),
        ],
      ),

      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: searchController,
              decoration: InputDecoration(
                hintText: "Search conversations...",
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              onChanged: (value) {
                setState(() {
                  search = value;
                });
              },
            ),
          ),

          Expanded(
            child: filtered.isEmpty
                ? const Center(child: Text("No conversations found"))
                : RefreshIndicator(
                    onRefresh: () async {
                      await Future.delayed(const Duration(seconds: 1));
                    },
                    child: ListView.separated(
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final chat = filtered[index];

                        return Dismissible(
                          key: Key(chat["name"]),
                          background: Container(
                            color: Colors.red,
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 20),
                            child: const Icon(
                              Icons.delete,
                              color: Colors.white,
                            ),
                          ),
                          direction: DismissDirection.endToStart,
                          confirmDismiss: (_) async {
                            return await showDialog(
                              context: context,
                              builder: (_) => AlertDialog(
                                title: const Text('Delete Chat'),
                                content: const Text(
                                  'Delete this conversation?',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () {
                                      Navigator.pop(context, false);
                                    },
                                    child: const Text('Cancel'),
                                  ),

                                  ElevatedButton(
                                    onPressed: () {
                                      Navigator.pop(context, true);
                                    },
                                    child: const Text('Delete'),
                                  ),
                                ],
                              ),
                            );
                          },
                          onDismissed: (_) {
                            setState(() {
                              conversations.remove(chat);
                            });

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Conversation deleted'),
                              ),
                            );
                          },
                          child: ConversationTile(
                            name: chat["name"],
                            propertyTitle: chat["property"],
                            lastMessage: chat["message"],
                            time: chat["time"],
                            unreadCount: chat["unread"],
                            isOnline: chat["online"],
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ChatPage(
                                    userName: chat["name"],
                                    propertyTitle: chat["property"],
                                  ),
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

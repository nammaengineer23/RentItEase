import 'package:flutter/material.dart';

import '../widgets/conversation_tile.dart';
import 'chat_page.dart';

class ChatListPage extends StatelessWidget {
  const ChatListPage({super.key});

  @override
  Widget build(BuildContext context) {
    final conversations = [
      {
        "name": "Rahul Sharma",
        "property": "2 BHK Apartment",
        "message": "Yes, tomorrow at 10:30 AM works.",
        "time": "10:30 AM",
        "unread": 2,
      },
      {
        "name": "Priya Verma",
        "property": "1 BHK Studio",
        "message": "Thank you.",
        "time": "Yesterday",
        "unread": 0,
      },
      {
        "name": "Amit Kumar",
        "property": "3 BHK Villa",
        "message": "Can you share more photos?",
        "time": "Mon",
        "unread": 1,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text("Chats"),
        centerTitle: true,
      ),
      body: ListView.separated(
        itemCount: conversations.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final chat = conversations[index];

          return ConversationTile(
            name: chat["name"] as String,
            propertyTitle: chat["property"] as String,
            lastMessage: chat["message"] as String,
            time: chat["time"] as String,
            unreadCount: chat["unread"] as int,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ChatPage(
                    userName: chat["name"] as String,
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
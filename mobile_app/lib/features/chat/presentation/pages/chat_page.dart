import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/chat_provider.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/message_input.dart';

class ChatPage extends ConsumerStatefulWidget {
  final String userName;

  const ChatPage({
    super.key,
    required this.userName,
  });

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final ScrollController _scrollController =
      ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatProvider);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              backgroundColor: Colors.blue.shade100,
              child: Text(
                widget.userName.substring(0, 1),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                widget.userName,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () {
              // TODO
              // Voice Call
            },
            icon: const Icon(Icons.call),
          ),
          IconButton(
            onPressed: () {
              // TODO
              // Video Call
            },
            icon: const Icon(Icons.videocam),
          ),
        ],
      ),

      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(
                vertical: 12,
              ),
              itemCount: messages.length,
              itemBuilder: (context, index) {
                return ChatBubble(
                  message: messages[index],
                );
              },
            ),
          ),

          MessageInput(
            onSend: (text) {
              ref
                  .read(chatProvider.notifier)
                  .sendMessage(text);

              _scrollToBottom();

              // TODO
              // Send message to backend
            },
          ),
        ],
      ),
    );
  }
}
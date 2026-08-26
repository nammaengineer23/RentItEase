import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../authentication/providers/authentication_provider.dart';
import '../../providers/chat_provider.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/message_input.dart';

class ChatPage extends ConsumerStatefulWidget {
  const ChatPage({
    super.key,
    this.conversationId,
    this.propertyId,
    this.userName = 'Owner',
    this.propertyTitle,
    this.propertyImage,
  }) : assert(
         conversationId != null || propertyId != null,
         'A conversationId or propertyId is required.',
       );

  final String? conversationId;
  final String? propertyId;
  final String userName;
  final String? propertyTitle;
  final String? propertyImage;

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    Future.microtask(_openConversation);
  }

  Future<void> _openConversation() async {
    final notifier = ref.read(chatProvider.notifier);

    if (widget.conversationId != null) {
      await notifier.openConversation(widget.conversationId!);
    } else {
      await notifier.createAndOpenConversation(widget.propertyId!);
    }

    _scrollToBottom();
  }

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
    final state = ref.watch(chatProvider);
    final currentUserId = ref
            .watch(authenticationProvider)
            .authResponse
            ?.user
            .id ??
        '';

    ref.listen(chatProvider.select((value) => value.messages.length), (
      previous,
      next,
    ) {
      if (previous != next) {
        _scrollToBottom();
      }
    });

    return Scaffold(
      appBar: AppBar(
        elevation: 1,
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: Colors.blue.shade100,
              backgroundImage: widget.propertyImage?.isNotEmpty == true
                  ? NetworkImage(widget.propertyImage!)
                  : null,
              child: widget.propertyImage?.isNotEmpty == true
                  ? null
                  : Text(
                      widget.userName.isEmpty
                          ? '?'
                          : widget.userName.substring(0, 1).toUpperCase(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
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
      ),
      body: Column(
        children: [
          if (widget.propertyTitle != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              color: Colors.orange.shade50,
              child: Row(
                children: [
                  const Icon(Icons.home, color: Colors.orange),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      widget.propertyTitle!,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          if (state.error != null)
            MaterialBanner(
              content: Text(state.error!),
              actions: [
                TextButton(
                  onPressed: () {
                    ref.read(chatProvider.notifier).clearError();
                    _openConversation();
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          Expanded(
            child: _buildMessages(state, currentUserId),
          ),
          MessageInput(
            onSend: (text) async {
              final sent = await ref
                  .read(chatProvider.notifier)
                  .sendMessage(text);
              if (sent) {
                _scrollToBottom();
              }
            },
            onTyping: (_) {},
            onCamera: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Image messages are not yet supported.'),
                ),
              );
            },
            onGallery: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Image messages are not yet supported.'),
                ),
              );
            },
          ),
          if (state.isSending)
            const LinearProgressIndicator(minHeight: 2),
        ],
      ),
    );
  }

  Widget _buildMessages(ChatState state, String currentUserId) {
    if (state.isLoadingMessages) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.messages.isEmpty) {
      return const Center(
        child: Text('No messages yet. Start the conversation.'),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(vertical: 12),
      itemCount: state.messages.length,
      itemBuilder: (context, index) {
        final message = state.messages[index];
        return ChatBubble(
          message: message,
          isMine: message.senderId == currentUserId,
        );
      },
    );
  }
}

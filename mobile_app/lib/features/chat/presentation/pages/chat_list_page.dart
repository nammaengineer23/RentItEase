import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/conversation_entity.dart';
import '../../providers/chat_provider.dart';
import '../widgets/conversation_tile.dart';
import 'chat_page.dart';

class ChatListPage extends ConsumerStatefulWidget {
  const ChatListPage({super.key});

  @override
  ConsumerState<ChatListPage> createState() => _ChatListPageState();
}

class _ChatListPageState extends ConsumerState<ChatListPage> {
  final TextEditingController _searchController = TextEditingController();
  String _search = '';

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(chatProvider.notifier).loadConversations());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _formatTime(DateTime dateTime) {
    final local = dateTime.toLocal();
    final now = DateTime.now();

    if (local.year == now.year &&
        local.month == now.month &&
        local.day == now.day) {
      final hour = local.hour > 12
          ? local.hour - 12
          : (local.hour == 0 ? 12 : local.hour);
      final minute = local.minute.toString().padLeft(2, '0');
      final period = local.hour >= 12 ? 'PM' : 'AM';
      return '$hour:$minute $period';
    }

    return '${local.day}/${local.month}/${local.year}';
  }

  bool _matches(ConversationEntity conversation) {
    final query = _search.trim().toLowerCase();
    if (query.isEmpty) {
      return true;
    }

    return conversation.otherUserName.toLowerCase().contains(query) ||
        conversation.propertyTitle.toLowerCase().contains(query) ||
        (conversation.lastMessage?.toLowerCase().contains(query) ?? false);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(chatProvider);
    final conversations = state.conversations.where(_matches).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chats'),
        centerTitle: true,
        actions: [
          IconButton(
            tooltip: 'Refresh conversations',
            icon: const Icon(Icons.refresh),
            onPressed: state.isLoadingConversations
                ? null
                : () => ref.read(chatProvider.notifier).loadConversations(),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search conversations...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              onChanged: (value) => setState(() => _search = value),
            ),
          ),
          if (state.error != null)
            MaterialBanner(
              content: Text(state.error!),
              actions: [
                TextButton(
                  onPressed: () {
                    ref.read(chatProvider.notifier)
                      ..clearError()
                      ..loadConversations();
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          Expanded(
            child: _buildBody(state, conversations),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(
    ChatState state,
    List<ConversationEntity> conversations,
  ) {
    if (state.isLoadingConversations && state.conversations.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (conversations.isEmpty) {
      return RefreshIndicator(
        onRefresh: ref.read(chatProvider.notifier).loadConversations,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 180),
            Center(child: Text('No conversations found')),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: ref.read(chatProvider.notifier).loadConversations,
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: conversations.length,
        separatorBuilder: (_, _) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final conversation = conversations[index];

          return ConversationTile(
            name: conversation.otherUserName,
            propertyTitle: conversation.propertyTitle,
            lastMessage: conversation.lastMessage ?? 'Start a conversation',
            time: _formatTime(conversation.updatedAt),
            imageUrl: conversation.propertyImage,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ChatPage(
                    conversationId: conversation.conversationId,
                    userName: conversation.otherUserName,
                    propertyTitle: conversation.propertyTitle,
                    propertyImage: conversation.propertyImage,
                  ),
                ),
              ).then((_) {
                if (mounted) {
                  ref.read(chatProvider.notifier).loadConversations();
                }
              });
            },
          );
        },
      ),
    );
  }
}

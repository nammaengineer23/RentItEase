import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:mobile_app/features/chat/domain/entities/conversation_entity.dart';
import 'package:mobile_app/features/chat/domain/entities/message_entity.dart';
import 'package:mobile_app/features/chat/domain/repositories/chat_repository.dart';
import 'package:mobile_app/features/chat/presentation/pages/chat_list_page.dart';
import 'package:mobile_app/features/chat/providers/chat_provider.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('conversation loads, opens, marks read, and sends a message', (
    tester,
  ) async {
    final repository = _FakeChatRepository();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          chatRepositoryProvider.overrideWithValue(repository),
        ],
        child: const MaterialApp(home: ChatListPage()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Owner User'), findsOneWidget);
    expect(find.text('Test Property'), findsOneWidget);

    await tester.tap(find.text('Owner User'));
    await tester.pumpAndSettle();

    expect(find.text('Existing message'), findsOneWidget);
    expect(repository.markedRead, isTrue);

    await tester.enterText(
      find.byType(TextField),
      'Integration test message',
    );
    await tester.pump();

    await tester.tap(find.byKey(const ValueKey('send')));
    await tester.pumpAndSettle();

    expect(find.text('Integration test message'), findsOneWidget);
    expect(repository.sentTexts, contains('Integration test message'));
  });
}

class _FakeChatRepository implements ChatRepository {
  static const conversationId = 'conversation-1';
  bool markedRead = false;
  final List<String> sentTexts = [];

  @override
  Future<List<ConversationEntity>> getConversations() async {
    return [
      ConversationEntity(
        conversationId: conversationId,
        propertyId: 'property-1',
        propertyTitle: 'Test Property',
        propertyImage: null,
        otherUserId: 'owner-1',
        otherUserName: 'Owner User',
        lastMessage: sentTexts.isEmpty ? 'Existing message' : sentTexts.last,
        updatedAt: DateTime(2026, 8, 26, 12),
      ),
    ];
  }

  @override
  Future<ConversationEntity> createConversation({
    required String propertyId,
  }) async {
    return (await getConversations()).first;
  }

  @override
  Future<List<MessageEntity>> getMessages({
    required String conversationId,
  }) async {
    return [
      MessageEntity(
        id: 'message-1',
        conversationId: conversationId,
        senderId: 'owner-1',
        senderName: 'Owner User',
        text: 'Existing message',
        messageType: 'TEXT',
        isRead: false,
        createdAt: DateTime(2026, 8, 26, 12),
      ),
    ];
  }

  @override
  Future<MessageEntity> sendMessage({
    required String conversationId,
    required String text,
  }) async {
    sentTexts.add(text);

    return MessageEntity(
      id: 'message-${sentTexts.length + 1}',
      conversationId: conversationId,
      senderId: 'tenant-1',
      senderName: 'Tenant User',
      text: text,
      messageType: 'TEXT',
      isRead: false,
      createdAt: DateTime(2026, 8, 26, 12, sentTexts.length),
    );
  }

  @override
  Future<void> markAsRead({required String conversationId}) async {
    markedRead = true;
  }

  @override
  Future<MessageEntity> editMessage({
    required String messageId,
    required String text,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<void> deleteMessage({required String messageId}) {
    throw UnimplementedError();
  }
}

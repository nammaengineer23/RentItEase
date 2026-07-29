import '../../domain/entities/chat_entity.dart';
import '../../domain/repositories/chat_repository.dart';

class ChatRepositoryImpl implements ChatRepository {
  final List<ChatEntity> _chats = [
    ChatEntity(
      id: 'chat_001',
      propertyId: 'property_001',
      propertyTitle: '2 BHK Apartment, Whitefield',
      propertyImage:
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      senderId: 'owner_001',
      receiverId: 'tenant_001',
      senderName: 'Rajesh Kumar',
      receiverName: 'Shrikant',
      senderAvatar: '',
      receiverAvatar: '',
      lastMessage: 'Sure, you can visit tomorrow at 5 PM.',
      lastMessageTime: DateTime.now().subtract(
        const Duration(minutes: 10),
      ),
      unreadCount: 2,
      isOnline: true,
      isTyping: false,
      isRead: false,
    ),
    ChatEntity(
      id: 'chat_002',
      propertyId: 'property_002',
      propertyTitle: '1 BHK Studio, Indiranagar',
      propertyImage:
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
      senderId: 'owner_002',
      receiverId: 'tenant_001',
      senderName: 'Priya Sharma',
      receiverName: 'Shrikant',
      senderAvatar: '',
      receiverAvatar: '',
      lastMessage: 'Thank you for visiting.',
      lastMessageTime: DateTime.now().subtract(
        const Duration(hours: 3),
      ),
      unreadCount: 0,
      isOnline: false,
      isTyping: false,
      isRead: true,
    ),
  ];

  @override
  Future<List<ChatEntity>> load() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return List<ChatEntity>.from(_chats);
  }

  @override
  Future<ChatEntity?> getConversation(String chatId) async {
    await Future.delayed(const Duration(milliseconds: 200));

    try {
      return _chats.firstWhere((chat) => chat.id == chatId);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> sendMessage({
    required String chatId,
    required String message,
  }) async {
    await Future.delayed(const Duration(milliseconds: 300));

    final index = _chats.indexWhere((chat) => chat.id == chatId);

    if (index == -1) return;

    final chat = _chats[index];

    _chats[index] = chat.copyWith(
      lastMessage: message,
      lastMessageTime: DateTime.now(),
      isRead: false,
    );
  }

  @override
  Future<void> sendImage({
    required String chatId,
    required String imagePath,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    final index = _chats.indexWhere((chat) => chat.id == chatId);

    if (index == -1) return;

    final chat = _chats[index];

    _chats[index] = chat.copyWith(
      lastMessage: '📷 Image',
      lastMessageTime: DateTime.now(),
      isRead: false,
    );
  }

  @override
  Future<void> markAsRead(String chatId) async {
    await Future.delayed(const Duration(milliseconds: 150));

    final index = _chats.indexWhere((chat) => chat.id == chatId);

    if (index == -1) return;

    final chat = _chats[index];

    _chats[index] = chat.copyWith(
      unreadCount: 0,
      isRead: true,
    );
  }

  @override
  Future<void> deleteConversation(String chatId) async {
    await Future.delayed(const Duration(milliseconds: 200));

    _chats.removeWhere((chat) => chat.id == chatId);
  }

  @override
  Future<List<ChatEntity>> search(String keyword) async {
    await Future.delayed(const Duration(milliseconds: 250));

    if (keyword.trim().isEmpty) {
      return List<ChatEntity>.from(_chats);
    }

    final query = keyword.toLowerCase();

    return _chats.where((chat) {
      return chat.senderName.toLowerCase().contains(query) ||
          chat.receiverName.toLowerCase().contains(query) ||
          chat.propertyTitle.toLowerCase().contains(query) ||
          chat.lastMessage.toLowerCase().contains(query);
    }).toList();
  }
}
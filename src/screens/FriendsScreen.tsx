import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useStore } from '../store/useStore';
import { Colors, Radius, Spacing, Typography } from '../theme';

type EditingFriend = {
  id: string;
  name: string;
  link?: string;
  currentStreak: number;
  bestStreak: number;
} | null;

export const FriendsScreen: React.FC = () => {
  const { friends, addFriend, removeFriend, updateFriendStreak } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendLink, setFriendLink] = useState('');
  const [editingFriend, setEditingFriend] = useState<EditingFriend>(null);
  const [editName, setEditName] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editCurrentStreak, setEditCurrentStreak] = useState('0');
  const [editBestStreak, setEditBestStreak] = useState('0');

  const handleAddFriend = () => {
    if (!friendName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom');
      return;
    }
    addFriend(friendName, friendLink);
    setFriendName('');
    setFriendLink('');
    setModalVisible(false);
  };

  const handleRemoveFriend = (id: string, name: string) => {
    Alert.alert('Supprimer ami', `Êtes-vous sûr de vouloir supprimer ${name}?`, [
      { text: 'Annuler', onPress: () => {} },
      {
        text: 'Supprimer',
        onPress: () => removeFriend(id),
        style: 'destructive',
      },
    ]);
  };

  const handleEditFriend = (friend: typeof friends[0]) => {
    setEditingFriend(friend);
    setEditName(friend.name);
    setEditLink(friend.link || '');
    setEditCurrentStreak(friend.currentStreak.toString());
    setEditBestStreak(friend.bestStreak.toString());
  };

  const handleSaveEdit = () => {
    if (!editingFriend) return;
    if (!editName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom');
      return;
    }
    updateFriendStreak(
      editingFriend.id,
      parseInt(editCurrentStreak) || 0,
      parseInt(editBestStreak) || 0,
      editingFriend.dayLogs
    );
    setEditingFriend(null);
  };

  // Sort friends by current streak (descending)
  const sortedFriends = [...friends].sort((a, b) => b.currentStreak - a.currentStreak);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brand}>Ignite.</Text>
        </View>

        {friends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>bahaha cheh t'a pas d'amis</Text>
            <Text style={styles.emptySubtitle}>looser 67</Text>
            <Text style={styles.emptyMusic}>tungtung tung sahur</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionLabel}>LEADERBOARD ({friends.length})</Text>
            {sortedFriends.map((friend, index) => (
              <TouchableOpacity
                key={friend.id}
                activeOpacity={0.7}
                onPress={() => handleEditFriend(friend)}
                onLongPress={() => handleRemoveFriend(friend.id, friend.name)}
              >
                <View style={styles.friendCard}>
                  <View style={styles.friendRank}>
                    <Text style={styles.rankBadge}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    {friend.link && <Text style={styles.friendLink}>{friend.link}</Text>}
                  </View>
                  <View style={styles.friendStreak}>
                    <Text style={styles.streakValue}>{friend.currentStreak}</Text>
                    <Text style={styles.streakFlame}>🔥</Text>
                  </View>
                  <View style={styles.friendBest}>
                    <Text style={styles.bestValue}>{friend.bestStreak}</Text>
                    <Text style={styles.bestLabel}>Best</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>+ Ajouter un ami</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Friend Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible && !editingFriend}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un ami</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nom de l'ami"
                  placeholderTextColor={Colors.textMuted}
                  value={friendName}
                  onChangeText={setFriendName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lien (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="lien.example.com ou @username"
                  placeholderTextColor={Colors.textMuted}
                  value={friendLink}
                  onChangeText={setFriendLink}
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddFriend}>
                <Text style={styles.submitButtonText}>Ajouter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Friend Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={editingFriend !== null}
        onRequestClose={() => setEditingFriend(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Éditer {editingFriend?.name}</Text>
              <TouchableOpacity onPress={() => setEditingFriend(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lien</Text>
                <TextInput
                  style={styles.input}
                  value={editLink}
                  onChangeText={setEditLink}
                />
              </View>

              <View style={styles.twoColumnRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Série actuelle</Text>
                  <TextInput
                    style={styles.input}
                    value={editCurrentStreak}
                    onChangeText={setEditCurrentStreak}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Meilleure série</Text>
                  <TextInput
                    style={styles.input}
                    value={editBestStreak}
                    onChangeText={setEditBestStreak}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSaveEdit}>
                <Text style={styles.submitButtonText}>Enregistrer</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteButton} onPress={() => {
                if (editingFriend) {
                  handleRemoveFriend(editingFriend.id, editingFriend.name);
                  setEditingFriend(null);
                }
              }}>
                <Text style={styles.deleteButtonText}>Supprimer cet ami</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditingFriend(null)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  brand: { fontSize: 22, fontWeight: '800', color: Colors.flame, marginBottom: Spacing.base },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptySubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.flame,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  emptyMusic: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  sectionLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },

  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    gap: Spacing.md,
  },
  friendRank: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadge: { fontSize: 18, fontWeight: '700' },
  friendInfo: { flex: 1 },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  friendLink: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  friendStreak: {
    alignItems: 'center',
    gap: 2,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.flame,
  },
  streakFlame: {
    fontSize: 16,
  },

  friendBest: {
    alignItems: 'center',
  },
  bestValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
  },
  bestLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },

  addButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.flame,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    fontSize: 20,
    color: Colors.textMuted,
  },

  modalForm: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: 14,
  },

  submitButton: {
    backgroundColor: Colors.flame,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },

  twoColumnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: Colors.red,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.red,
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});

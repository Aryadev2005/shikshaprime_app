import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';
import { useCreateAssignment, useAssignmentMetadata } from '../../hooks/useAssignments';
import { AssignmentsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AssignmentsStackParamList, 'CreateAssignment'>;

interface PickerItem { id: string; label: string }

const InlinePicker: React.FC<{
  label: string;
  placeholder: string;
  items: PickerItem[];
  value: string;
  onChange: (id: string) => void;
}> = ({ label, placeholder, items, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.id === value);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setOpen(true)}>
        <Text style={[styles.pickerBtnText, !selected && styles.pickerPlaceholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={TOKENS.ink3} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={items}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, item.id === value && styles.modalItemActive]}
                  onPress={() => { onChange(item.id); setOpen(false); }}
                >
                  <Text style={[styles.modalItemText, item.id === value && styles.modalItemTextActive]}>
                    {item.label}
                  </Text>
                  {item.id === value && (
                    <MaterialCommunityIcons name="check" size={16} color={TOKENS.plum} />
                  )}
                </TouchableOpacity>
              )}
              style={{ maxHeight: 260 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export const CreateAssignmentScreen: React.FC<Props> = ({ navigation }) => {
  const { data: metadata } = useAssignmentMetadata();
  const { mutate: create, isPending } = useCreateAssignment();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [allowLate, setAllowLate] = useState(false);

  const subjects: PickerItem[] = (metadata?.subjects ?? []).map((s) => ({
    id: s.id,
    label: s.name,
  }));
  const classes: PickerItem[] = (metadata?.classes ?? []).map((c) => ({
    id: c.id,
    label: c.section ? `${c.name} – ${c.section}` : c.name,
  }));

  const handleCreate = () => {
    if (!title.trim() || !classId || !subjectId || !dueDate.trim()) {
      Alert.alert('Missing Fields', 'Please fill in title, class, subject and due date.');
      return;
    }

    // Basic YYYY-MM-DD validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      Alert.alert('Invalid Date', 'Due date must be in YYYY-MM-DD format.');
      return;
    }

    create(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        class_id: classId,
        subject_id: subjectId,
        due_date: dueDate,
        allow_late_submissions: allowLate,
      },
      {
        onSuccess: () => {
          Alert.alert('Created!', 'Assignment published to students.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: () => Alert.alert('Error', 'Failed to create assignment. Please try again.'),
      },
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={TOKENS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Assignment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chapter 5 Exercise"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />
        </View>

        {/* Subject & Class pickers */}
        <InlinePicker
          label="Subject *"
          placeholder="Select subject"
          items={subjects}
          value={subjectId}
          onChange={setSubjectId}
        />
        <InlinePicker
          label="Class *"
          placeholder="Select class"
          items={classes}
          value={classId}
          onChange={setClassId}
        />

        {/* Due date */}
        <View style={styles.field}>
          <Text style={styles.label}>Due Date * (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-06-20"
            value={dueDate}
            onChangeText={setDueDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Brief description of the assignment"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Instructions */}
        <View style={styles.field}>
          <Text style={styles.label}>Instructions</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Step-by-step instructions for students"
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Late submissions toggle */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Allow Late Submissions</Text>
            <Text style={styles.toggleSub}>Students can submit after the due date</Text>
          </View>
          <Switch
            value={allowLate}
            onValueChange={setAllowLate}
            trackColor={{ false: TOKENS.line, true: TOKENS.plum500 }}
            thumbColor={TOKENS.paper}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.createBtn, isPending && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color={TOKENS.paper} />
          ) : (
            <>
              <MaterialCommunityIcons name="send-outline" size={18} color={TOKENS.paper} />
              <Text style={styles.createBtnText}>Publish Assignment</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.ink },
  content: { padding: 20, paddingBottom: 60 },
  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: TOKENS.ink3, marginBottom: 7 },
  input: {
    borderWidth: 1.5,
    borderColor: TOKENS.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: TOKENS.ink,
    backgroundColor: TOKENS.surface,
  },
  multiline: { minHeight: 80, paddingTop: 12 },

  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: TOKENS.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: TOKENS.surface,
  },
  pickerBtnText: { fontSize: 15, color: TOKENS.ink },
  pickerPlaceholder: { color: TOKENS.ink4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: TOKENS.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: TOKENS.ink, marginBottom: 12 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line2,
  },
  modalItemActive: { backgroundColor: TOKENS.plumTint },
  modalItemText: { fontSize: 15, color: TOKENS.ink },
  modalItemTextActive: { color: TOKENS.plum, fontWeight: '600' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: TOKENS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: TOKENS.ink },
  toggleSub: { fontSize: 12, color: TOKENS.ink3, marginTop: 2 },

  createBtn: {
    backgroundColor: TOKENS.plum,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontSize: 16, fontWeight: '700', color: TOKENS.paper },
});

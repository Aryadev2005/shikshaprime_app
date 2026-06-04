import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';
import {
  useAssignmentDetail,
  useSubmitAssignment,
  useGradeSubmission,
} from '../../hooks/useAssignments';
import { AssignmentSubmission } from '../../types/assignment';
import { AssignmentsStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<AssignmentsStackParamList, 'AssignmentDetail'>;

const STATUS_COLORS: Record<string, string> = {
  PENDING: TOKENS.amber,
  SUBMITTED: TOKENS.blue,
  GRADED: TOKENS.green,
  OVERDUE: TOKENS.red,
};

const GradeRow: React.FC<{
  submission: AssignmentSubmission;
  assignmentId: string;
}> = ({ submission, assignmentId }) => {
  const { mutate: grade, isPending } = useGradeSubmission(assignmentId);
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [gradeInput, setGradeInput] = useState(submission.grade ?? '');
  const [marksInput, setMarksInput] = useState(
    submission.marksObtained !== undefined ? String(submission.marksObtained) : '',
  );

  const handleGrade = () => {
    grade(
      {
        submissionId: submission.submissionId,
        data: {
          grade: gradeInput,
          marks_obtained: Number(marksInput),
        },
      },
      {
        onSuccess: () => {
          Alert.alert('Graded', `${submission.studentName ?? 'Student'} has been graded.`);
          setShowGradeForm(false);
        },
        onError: () => Alert.alert('Error', 'Failed to save grade.'),
      },
    );
  };

  return (
    <View style={sStyles.submissionRow}>
      <View style={sStyles.submissionInfo}>
        <Text style={sStyles.submissionName}>{submission.studentName ?? submission.studentId}</Text>
        {submission.submissionDate && (
          <Text style={sStyles.submissionDate}>
            Submitted {new Date(submission.submissionDate).toLocaleDateString('en-IN')}
          </Text>
        )}
      </View>
      {submission.grade ? (
        <View style={sStyles.gradedPill}>
          <Text style={sStyles.gradedPillText}>{submission.grade}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={sStyles.gradeBtn}
          onPress={() => setShowGradeForm(!showGradeForm)}
        >
          <Text style={sStyles.gradeBtnText}>Grade</Text>
        </TouchableOpacity>
      )}
      {showGradeForm && (
        <View style={sStyles.gradeForm}>
          <View style={sStyles.gradeFormRow}>
            <Text style={sStyles.gradeFormLabel}>Grade</Text>
            <TouchableOpacity
              style={sStyles.gradeFormInput}
              onPress={() =>
                Alert.prompt(
                  'Enter Grade',
                  'e.g. A, B+, 90',
                  (v) => setGradeInput(v ?? gradeInput),
                  'plain-text',
                  gradeInput,
                )
              }
            >
              <Text style={{ color: gradeInput ? TOKENS.ink : TOKENS.ink4 }}>
                {gradeInput || 'Tap to enter'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={sStyles.gradeFormRow}>
            <Text style={sStyles.gradeFormLabel}>Marks</Text>
            <TouchableOpacity
              style={sStyles.gradeFormInput}
              onPress={() =>
                Alert.prompt(
                  'Marks Obtained',
                  'Numeric value',
                  (v) => setMarksInput(v ?? marksInput),
                  'plain-text',
                  marksInput,
                )
              }
            >
              <Text style={{ color: marksInput ? TOKENS.ink : TOKENS.ink4 }}>
                {marksInput || 'Tap to enter'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[sStyles.submitGradeBtn, isPending && { opacity: 0.6 }]}
            onPress={handleGrade}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color={TOKENS.paper} size="small" />
            ) : (
              <Text style={sStyles.submitGradeBtnText}>Save Grade</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const sStyles = StyleSheet.create({
  submissionRow: {
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line2,
    paddingVertical: 12,
    gap: 6,
  },
  submissionInfo: { flex: 1 },
  submissionName: { fontSize: 14, fontWeight: '600', color: TOKENS.ink },
  submissionDate: { fontSize: 12, color: TOKENS.ink3, marginTop: 2 },
  gradedPill: {
    alignSelf: 'flex-start',
    backgroundColor: TOKENS.greenTint,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gradedPillText: { fontSize: 13, fontWeight: '700', color: TOKENS.green },
  gradeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: TOKENS.plum,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gradeBtnText: { fontSize: 13, fontWeight: '600', color: TOKENS.paper },
  gradeForm: {
    backgroundColor: TOKENS.surface,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  gradeFormRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradeFormLabel: { width: 50, fontSize: 13, color: TOKENS.ink3 },
  gradeFormInput: {
    flex: 1,
    fontSize: 14,
    color: TOKENS.ink,
    borderWidth: 1,
    borderColor: TOKENS.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: TOKENS.paper,
  },
  submitGradeBtn: {
    backgroundColor: TOKENS.plum,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  submitGradeBtnText: { color: TOKENS.paper, fontWeight: '600', fontSize: 14 },
});

export const AssignmentDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params;
  const { data, isLoading, isError } = useAssignmentDetail(id);
  const { mutate: submit, isPending: isSubmitting } = useSubmitAssignment();
  const token = useAuthStore((s) => s.token);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const isTeacher = (() => {
    try {
      const payload = JSON.parse(atob((token ?? '').split('.')[1]));
      return (payload as { role?: string }).role === 'teacher';
    } catch {
      return false;
    }
  })();

  const handlePickAndSubmit = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setSelectedFileName(asset.name);

      const formData = new FormData();
      formData.append('assignmentFile', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/pdf',
      } as unknown as Blob);
      formData.append('assignment_id', id);

      submit(formData, {
        onSuccess: (res) => {
          Alert.alert(
            'Submitted!',
            `Assignment submitted on ${new Date(res.submissionDate).toLocaleDateString('en-IN')}.`,
          );
        },
        onError: () => Alert.alert('Error', 'Failed to submit. Please try again.'),
      });
    } catch {
      Alert.alert('Error', 'Could not open document picker.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TOKENS.plum} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load assignment</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[data.status] ?? TOKENS.ink3;
  const isSubmitted = data.status === 'SUBMITTED' || data.status === 'GRADED';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={TOKENS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Assignment
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Meta info */}
        <View style={styles.metaRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{data.status}</Text>
          </View>
          <Text style={styles.subjectText}>{data.subjectName}</Text>
        </View>

        <Text style={styles.title}>{data.title}</Text>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar-outline" size={14} color={TOKENS.ink3} />
          <Text style={styles.infoText}>
            Due {new Date(data.dueDate).toLocaleDateString('en-IN', {
              weekday: 'short', day: 'numeric', month: 'short',
            })}
          </Text>
          {data.className && (
            <>
              <View style={styles.infoDot} />
              <Text style={styles.infoText}>{data.className}</Text>
            </>
          )}
        </View>

        {/* Grade info */}
        {data.grade && (
          <View style={styles.gradeCard}>
            <Text style={styles.gradeCardLabel}>Your Grade</Text>
            <Text style={styles.gradeCardValue}>{data.grade}</Text>
            {data.marksObtained !== undefined && data.maxMarks !== undefined && (
              <Text style={styles.gradeCardMarks}>
                {data.marksObtained} / {data.maxMarks} marks
              </Text>
            )}
          </View>
        )}

        {/* Description */}
        {data.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionBody}>{data.description}</Text>
          </View>
        ) : null}

        {/* Instructions */}
        {data.instructions ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.sectionBody}>{data.instructions}</Text>
          </View>
        ) : null}

        {/* Attachment link */}
        {data.fileUrl ? (
          <TouchableOpacity style={styles.attachmentRow}>
            <MaterialCommunityIcons name="file-pdf-box" size={20} color={TOKENS.red} />
            <Text style={styles.attachmentText}>View Attachment</Text>
            <MaterialCommunityIcons name="open-in-new" size={14} color={TOKENS.ink3} />
          </TouchableOpacity>
        ) : null}

        {/* Teacher: submissions list */}
        {isTeacher && data.submissions && data.submissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Submissions ({data.submissions.length})
            </Text>
            {data.submissions.map((s) => (
              <GradeRow key={s.submissionId} submission={s} assignmentId={id} />
            ))}
          </View>
        )}

        {/* Student submit area */}
        {!isTeacher && (
          <View style={styles.submitSection}>
            {isSubmitted ? (
              <View style={styles.submittedBanner}>
                <MaterialCommunityIcons name="check-circle" size={20} color={TOKENS.green} />
                <Text style={styles.submittedText}>Submitted</Text>
              </View>
            ) : (
              <>
                {selectedFileName && (
                  <View style={styles.selectedFile}>
                    <MaterialCommunityIcons name="file-outline" size={16} color={TOKENS.ink3} />
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {selectedFileName}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                  onPress={handlePickAndSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={TOKENS.paper} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="upload-outline"
                        size={18}
                        color={TOKENS.paper}
                      />
                      <Text style={styles.submitBtnText}>Pick & Submit</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: TOKENS.ink3 },

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
  headerTitle: { fontSize: 17, fontWeight: '700', color: TOKENS.ink, flex: 1, textAlign: 'center' },

  content: { padding: 20, paddingBottom: 60 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  subjectText: { fontSize: 13, color: TOKENS.ink3 },

  title: { fontSize: 22, fontWeight: '700', color: TOKENS.ink, marginBottom: 12 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  infoText: { fontSize: 13, color: TOKENS.ink3 },
  infoDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: TOKENS.ink4 },

  gradeCard: {
    backgroundColor: TOKENS.greenTint,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  gradeCardLabel: { fontSize: 12, color: TOKENS.green, fontWeight: '600', marginBottom: 4 },
  gradeCardValue: { fontSize: 32, fontWeight: '700', color: TOKENS.green },
  gradeCardMarks: { fontSize: 13, color: TOKENS.green, marginTop: 4 },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TOKENS.ink,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line2,
    paddingBottom: 8,
  },
  sectionBody: { fontSize: 14, color: TOKENS.ink2, lineHeight: 22 },

  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TOKENS.redTint,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  attachmentText: { flex: 1, fontSize: 14, color: TOKENS.ink, fontWeight: '500' },

  submitSection: { marginTop: 8 },
  submittedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TOKENS.greenTint,
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
  },
  submittedText: { fontSize: 15, fontWeight: '600', color: TOKENS.green },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TOKENS.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  selectedFileName: { flex: 1, fontSize: 13, color: TOKENS.ink3 },
  submitBtn: {
    backgroundColor: TOKENS.plum,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: TOKENS.paper },
});

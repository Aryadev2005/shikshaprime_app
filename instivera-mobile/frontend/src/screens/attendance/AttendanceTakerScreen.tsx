import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';
import { useClassStudents } from '../../hooks/useAttendance';
import { ClassStudent, AttendanceStatus } from '../../types/attendance';
import { AttendanceStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AttendanceStackParamList, 'AttendanceTaker'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;
const CARD_STACK_OFFSET = 8;

type Marking = { studentId: string; status: AttendanceStatus };

export const AttendanceTakerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { classId, date } = route.params;
  const { data, isLoading, isError } = useClassStudents(classId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [markings, setMarkings] = useState<Record<string, AttendanceStatus>>({});
  const [undoStack, setUndoStack] = useState<Marking[]>([]);

  const pan = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const students: ClassStudent[] = data?.students ?? [];

  const advance = useCallback(
    (status: AttendanceStatus) => {
      const student = students[currentIndex];
      if (!student) return;

      setUndoStack((prev) => [...prev, { studentId: student.studentId, status }]);
      setMarkings((prev) => ({ ...prev, [student.studentId]: status }));

      Animated.parallel([
        Animated.timing(pan, { toValue: { x: 0, y: 0 }, duration: 0, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        cardOpacity.setValue(1);
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);

        if (nextIndex >= students.length) {
          const finalMarkings = { ...markings, [student.studentId]: status };
          navigation.navigate('AttendanceReview', {
            students,
            markings: finalMarkings,
            date,
            classId,
          });
        }
      });
    },
    [students, currentIndex, markings, pan, cardOpacity, date, classId, navigation],
  );

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setMarkings((m) => {
      const next = { ...m };
      delete next[prev.studentId];
      return next;
    });
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, [undoStack]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, gs) => Math.abs(gs.dx) > 10,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (_e, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) {
          advance('PRESENT');
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          advance('ABSENT');
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TOKENS.paper} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load students</Text>
      </View>
    );
  }

  if (students.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No students in this class</Text>
      </View>
    );
  }

  const markedCount = Object.keys(markings).length;
  const progress = markedCount / students.length;
  const remaining = students.length - currentIndex;

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  const presentIndicatorOpacity = pan.x.interpolate({
    inputRange: [SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const absentIndicatorOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={TOKENS.paper} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Take Attendance</Text>
          <Text style={styles.headerSubtitle}>{date} · {students.length} students</Text>
        </View>
        <TouchableOpacity onPress={undo} disabled={undoStack.length === 0}>
          <MaterialCommunityIcons
            name="undo"
            size={24}
            color={undoStack.length > 0 ? TOKENS.coral : TOKENS.plum300}
          />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        {markedCount} / {students.length} marked
      </Text>

      {/* Card stack */}
      <View style={styles.stackContainer}>
        {/* Back cards */}
        {[2, 1].map((offset) => {
          const idx = currentIndex + offset;
          if (idx >= students.length) return null;
          return (
            <View
              key={idx}
              style={[
                styles.card,
                styles.cardBack,
                {
                  transform: [{ scale: 1 - offset * 0.04 }],
                  top: offset * CARD_STACK_OFFSET,
                  zIndex: 10 - offset,
                },
              ]}
            >
              <Text style={styles.cardNameBack} numberOfLines={1}>
                {students[idx].name}
              </Text>
            </View>
          );
        })}

        {/* Front card */}
        {currentIndex < students.length && (
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              {
                transform: [
                  { translateX: pan.x },
                  { rotate },
                ],
                opacity: cardOpacity,
                zIndex: 20,
              },
            ]}
            {...panResponder.panHandlers}
          >
            {/* Swipe indicators */}
            <Animated.View style={[styles.indicator, styles.presentIndicator, { opacity: presentIndicatorOpacity }]}>
              <MaterialCommunityIcons name="check-circle" size={40} color={TOKENS.green} />
              <Text style={[styles.indicatorLabel, { color: TOKENS.green }]}>PRESENT</Text>
            </Animated.View>
            <Animated.View style={[styles.indicator, styles.absentIndicator, { opacity: absentIndicatorOpacity }]}>
              <MaterialCommunityIcons name="close-circle" size={40} color={TOKENS.red} />
              <Text style={[styles.indicatorLabel, { color: TOKENS.red }]}>ABSENT</Text>
            </Animated.View>

            <View style={styles.cardAvatarCircle}>
              <Text style={styles.cardAvatarText}>
                {students[currentIndex].name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>

            <Text style={styles.cardName}>{students[currentIndex].name}</Text>
            <Text style={styles.cardCode}>{students[currentIndex].studentCode}</Text>
            {students[currentIndex].rollNo ? (
              <Text style={styles.cardRoll}>Roll #{students[currentIndex].rollNo}</Text>
            ) : null}

            <View style={styles.cardStats}>
              <Text style={styles.cardStatText}>
                {students[currentIndex].attendancePercentage}% overall
              </Text>
            </View>

            <Text style={styles.swipeHint}>← Absent · Present →</Text>
          </Animated.View>
        )}

        {remaining === 0 && (
          <View style={styles.allDoneCard}>
            <MaterialCommunityIcons name="check-all" size={48} color={TOKENS.green} />
            <Text style={styles.allDoneText}>All students marked!</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtnAbsent} onPress={() => advance('ABSENT')}>
          <MaterialCommunityIcons name="close" size={28} color={TOKENS.red} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnLate} onPress={() => advance('LATE')}>
          <MaterialCommunityIcons name="clock-outline" size={28} color={TOKENS.amber} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnPresent} onPress={() => advance('PRESENT')}>
          <MaterialCommunityIcons name="check" size={28} color={TOKENS.green} />
        </TouchableOpacity>
      </View>

      <Text style={styles.remainingText}>
        {remaining > 0 ? `${remaining} remaining` : 'Navigating to review…'}
      </Text>

      {/* Alert unused import prevention */}
      {false && Alert.alert('')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.plumDeep },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: TOKENS.plumDeep },
  errorText: { color: TOKENS.paper, fontSize: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.paper },
  headerSubtitle: { fontSize: 12, color: TOKENS.plum300, marginTop: 2 },

  progressTrack: {
    height: 4,
    backgroundColor: TOKENS.plum700,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: TOKENS.coral, borderRadius: 2 },
  progressLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: TOKENS.plum300,
    marginTop: 8,
    marginBottom: 16,
  },

  stackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 48,
    minHeight: 340,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  cardFront: { backgroundColor: TOKENS.paper },
  cardBack: { backgroundColor: TOKENS.surface },

  indicator: {
    position: 'absolute',
    top: 24,
    alignItems: 'center',
  },
  presentIndicator: { right: 24 },
  absentIndicator: { left: 24 },
  indicatorLabel: { fontSize: 12, fontWeight: '700', marginTop: 4 },

  cardAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: TOKENS.plum,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  cardAvatarText: { fontSize: 28, fontWeight: '700', color: TOKENS.paper },
  cardName: { fontSize: 22, fontWeight: '700', color: TOKENS.ink, textAlign: 'center' },
  cardCode: { fontSize: 14, color: TOKENS.ink3, marginTop: 4 },
  cardRoll: { fontSize: 13, color: TOKENS.ink4, marginTop: 2 },
  cardStats: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: TOKENS.surface,
    borderRadius: 8,
  },
  cardStatText: { fontSize: 13, color: TOKENS.ink3 },
  swipeHint: {
    position: 'absolute',
    bottom: 16,
    fontSize: 12,
    color: TOKENS.ink4,
  },
  cardNameBack: { fontSize: 16, color: TOKENS.ink3, fontWeight: '600' },

  allDoneCard: { alignItems: 'center', gap: 12 },
  allDoneText: { fontSize: 20, fontWeight: '700', color: TOKENS.paper },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  actionBtnAbsent: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TOKENS.redTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLate: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: TOKENS.amberTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPresent: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TOKENS.greenTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    textAlign: 'center',
    fontSize: 13,
    color: TOKENS.plum300,
    paddingBottom: 32,
    marginTop: 8,
  },
});

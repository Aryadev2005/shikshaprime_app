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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS } from '../../theme/tokens';
import { useClassStudents } from '../../hooks/useAttendance';
import { ClassStudent, AttendanceStatus } from '../../types/attendance';
import { AttendanceStackParamList } from '../../navigation/types';
import { Avatar } from '../../components/ui';

type Props = NativeStackScreenProps<AttendanceStackParamList, 'AttendanceTaker'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;
const CARD_WIDTH = SCREEN_WIDTH - 40;

type Marking = { studentId: string; status: AttendanceStatus };

// ─── Swipe card ──────────────────────────────────────────────────────────────

type SwipeCardProps = {
  student: ClassStudent;
  isTop: boolean;
  offsetY?: number;
  scale?: number;
  opacity?: number;
  pan?: Animated.ValueXY;
  presentOpacity?: Animated.AnimatedInterpolation<number>;
  absentOpacity?: Animated.AnimatedInterpolation<number>;
  panHandlers?: object;
};

const SwipeCard: React.FC<SwipeCardProps> = ({
  student,
  isTop,
  offsetY = 0,
  scale = 1,
  opacity = 1,
  pan,
  presentOpacity,
  absentOpacity,
  panHandlers,
}) => {
  const initials = student.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const pct = student.attendancePercentage ?? 0;
  const barHeights = [14, 10, 18, 13, 20, 16, 22];

  const rotate = pan
    ? pan.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: ['-8deg', '0deg', '8deg'],
        extrapolate: 'clamp',
      })
    : '0deg';

  const translateX = pan ? pan.x : 0;

  const animStyle = isTop
    ? { transform: [{ translateX }, { rotate }] }
    : { transform: [{ scale }, { translateY: offsetY }] };

  return (
    <Animated.View
      style={[
        styles.cardAbsolute,
        { opacity, zIndex: isTop ? 20 : 10 },
        animStyle,
      ]}
      {...(isTop && panHandlers ? panHandlers : {})}
    >
      <View style={styles.cardInner}>
        {/* PRESENT stamp */}
        {isTop && presentOpacity && (
          <Animated.View style={[styles.stamp, styles.stampPresent, { opacity: presentOpacity }]}>
            <Text style={[styles.stampText, { color: TOKENS.green }]}>PRESENT</Text>
          </Animated.View>
        )}
        {/* ABSENT stamp */}
        {isTop && absentOpacity && (
          <Animated.View style={[styles.stamp, styles.stampAbsent, { opacity: absentOpacity }]}>
            <Text style={[styles.stampText, { color: TOKENS.red }]}>ABSENT</Text>
          </Animated.View>
        )}

        {/* Big avatar area */}
        <View style={styles.cardAvatarBox}>
          <Text style={styles.cardAvatarInitials}>{initials}</Text>
        </View>

        {/* Identity */}
        <View style={styles.cardIdentityRow}>
          <View>
            <Text style={styles.cardName}>{student.name}</Text>
            <Text style={styles.cardRoll}>
              Roll {student.rollNo || student.studentCode} · {student.studentCode}
            </Text>
          </View>
          {student.attendancePercentage > 0 && (
            <View style={styles.streakBadge}>
              <MaterialCommunityIcons name="fire" size={13} color={TOKENS.coral} />
              <Text style={styles.streakText}>{Math.round(pct)}%</Text>
            </View>
          )}
        </View>

        {/* Mini stat + sparkline */}
        <View style={styles.cardStatBox}>
          <View>
            <Text style={styles.cardStatLabel}>SEMESTER ATTENDANCE</Text>
            <Text style={styles.cardStatValue}>{pct}%</Text>
          </View>
          <View style={styles.miniChart}>
            {barHeights.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.miniBar,
                  {
                    height: h,
                    backgroundColor: i === 6 ? TOKENS.plum : TOKENS.plum300,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── FAB button ──────────────────────────────────────────────────────────────

type FABProps = {
  icon: string;
  color: string;
  size?: number;
  primary?: boolean;
  onPress: () => void;
};

const FAB: React.FC<FABProps> = ({ icon, color, size = 56, primary, onPress }) => {
  if (primary) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.fabPrimary, { width: size, height: size, borderRadius: size / 2, shadowColor: color }]}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name={icon as any} size={28} color="#fff" />
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.fabSecondary, { width: size, height: size, borderRadius: size / 2 }]}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name={icon as any} size={size === 70 ? 26 : 22} color={color} />
    </TouchableOpacity>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

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
      onPanResponderMove: Animated.event([null, { dx: pan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_e, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) {
          advance('PRESENT');
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          advance('ABSENT');
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const presentOpacity = pan.x.interpolate({
    inputRange: [SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const absentOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: TOKENS.plumDeep }]}>
        <ActivityIndicator size="large" color={TOKENS.paper} />
      </View>
    );
  }

  if (isError || !data || students.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: TOKENS.plumDeep }]}>
        <Text style={{ color: TOKENS.paper, fontSize: 16 }}>
          {students.length === 0 ? 'No students in this class' : 'Failed to load students'}
        </Text>
      </View>
    );
  }

  const presentCount = Object.values(markings).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(markings).filter((s) => s === 'ABSENT').length;
  const progress = currentIndex / students.length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient
        colors={[TOKENS.plum700, TOKENS.plumDeep]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {/* Coral glow blob */}
      <View style={styles.glowBlob} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="close" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>Class · {classId}</Text>
          <Text style={styles.headerTitle}>Take Attendance</Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={undo}
          disabled={undoStack.length === 0}
        >
          <MaterialCommunityIcons
            name="undo-variant"
            size={18}
            color={undoStack.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)'}
          />
        </TouchableOpacity>
      </View>

      {/* Progress + counts */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>
            STUDENT {currentIndex + 1} OF {students.length}
          </Text>
          <View style={styles.countsRow}>
            <View style={[styles.countDot, { backgroundColor: TOKENS.green }]} />
            <Text style={styles.countText}>{presentCount}</Text>
            <View style={[styles.countDot, { backgroundColor: TOKENS.red }]} />
            <Text style={styles.countText}>{absentCount}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Card stack */}
      <View style={styles.stackContainer}>
        {currentIndex < students.length ? (
          <>
            {/* Back card 2 */}
            {currentIndex + 2 < students.length && (
              <SwipeCard
                student={students[currentIndex + 2]}
                isTop={false}
                offsetY={16}
                scale={0.9}
                opacity={0.4}
              />
            )}
            {/* Back card 1 */}
            {currentIndex + 1 < students.length && (
              <SwipeCard
                student={students[currentIndex + 1]}
                isTop={false}
                offsetY={8}
                scale={0.95}
                opacity={0.7}
              />
            )}
            {/* Front card */}
            <Animated.View style={{ opacity: cardOpacity, zIndex: 25 }}>
              <SwipeCard
                student={students[currentIndex]}
                isTop
                pan={pan}
                presentOpacity={presentOpacity}
                absentOpacity={absentOpacity}
                panHandlers={panResponder.panHandlers}
              />
            </Animated.View>
          </>
        ) : (
          <View style={styles.allDone}>
            <MaterialCommunityIcons name="check-all" size={48} color={TOKENS.green} />
            <Text style={styles.allDoneText}>All students marked!</Text>
          </View>
        )}
      </View>

      {/* Action FABs */}
      <View style={styles.fabRow}>
        <FAB icon="close" color={TOKENS.red} size={56} onPress={() => advance('ABSENT')} />
        <FAB icon="clock-outline" color={TOKENS.amber} size={56} onPress={() => advance('LATE')} />
        <FAB
          icon="check"
          color={TOKENS.green}
          size={70}
          primary
          onPress={() => advance('PRESENT')}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  glowBlob: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: TOKENS.coral,
    opacity: 0.12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.4 },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginTop: 2 },

  progressSection: { paddingHorizontal: 20 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 11.5, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 },
  countsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countDot: { width: 7, height: 7, borderRadius: 3.5 },
  countText: { fontSize: 11.5, color: '#fff', fontWeight: '600' },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: TOKENS.coral,
    borderRadius: 999,
  },

  stackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },

  cardAbsolute: {
    position: 'absolute',
    width: CARD_WIDTH,
  },
  cardInner: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 12,
    overflow: 'hidden',
  },

  stamp: {
    position: 'absolute',
    top: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2.5,
    zIndex: 10,
  },
  stampPresent: { right: 18, borderColor: TOKENS.green },
  stampAbsent: { left: 18, borderColor: TOKENS.red },
  stampText: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },

  cardAvatarBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: TOKENS.plumTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  cardAvatarInitials: {
    fontFamily: 'InstrumentSerif',
    fontSize: 96,
    color: TOKENS.plum,
    opacity: 0.85,
  },

  cardIdentityRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '700',
    color: TOKENS.ink,
    letterSpacing: -0.4,
  },
  cardRoll: { fontSize: 12.5, color: TOKENS.ink3, marginTop: 3 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { fontSize: 12, fontWeight: '600', color: TOKENS.coral },

  cardStatBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: TOKENS.plumTint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardStatLabel: { fontSize: 10.5, color: TOKENS.ink3, letterSpacing: 0.4 },
  cardStatValue: { fontSize: 15, fontWeight: '700', color: TOKENS.plum, marginTop: 2 },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 24,
    gap: 2,
  },
  miniBar: { width: 4, borderRadius: 2 },

  fabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 22,
    paddingBottom: 40,
    paddingTop: 16,
  },
  fabPrimary: {
    backgroundColor: TOKENS.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fabSecondary: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },

  allDone: { alignItems: 'center', gap: 12 },
  allDoneText: { fontSize: 20, fontWeight: '700', color: TOKENS.paper },
});

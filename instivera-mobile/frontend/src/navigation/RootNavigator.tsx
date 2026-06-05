import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthStack } from './AuthStack';
import { useAuthStore } from '../store/authStore';
import { TOKENS } from '../theme/tokens';
import { StudentAttendanceScreen } from '../screens/attendance/StudentAttendanceScreen';
import { AttendanceTakerScreen } from '../screens/attendance/AttendanceTakerScreen';
import { AttendanceReviewScreen } from '../screens/attendance/AttendanceReviewScreen';
import { AssignmentsScreen } from '../screens/assignments/AssignmentsScreen';
import { AssignmentDetailScreen } from '../screens/assignments/AssignmentDetailScreen';
import { CreateAssignmentScreen } from '../screens/assignments/CreateAssignmentScreen';
import { FeesScreen } from '../screens/fees/FeesScreen';
import { PaymentWebViewScreen } from '../screens/fees/PaymentWebViewScreen';
import { CalendarScreen } from '../screens/calendar/CalendarScreen';
import { StudentHubScreen } from '../screens/students/StudentHubScreen';
import { ChatConversationsScreen } from '../screens/chat/ChatConversationsScreen';
import { ChatRoomScreen } from '../screens/chat/ChatRoomScreen';
import {
  AttendanceStackParamList,
  AssignmentsStackParamList,
  FeesStackParamList,
  ChatStackParamList,
  CalendarStackParamList,
} from './types';

// ─── Stack navigators ─────────────────────────────────────────────────────────

const AttendanceStack = createNativeStackNavigator<AttendanceStackParamList>();
const AssignmentsStack = createNativeStackNavigator<AssignmentsStackParamList>();
const FeesStack = createNativeStackNavigator<FeesStackParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const CalendarStack = createNativeStackNavigator<CalendarStackParamList>();

type RootStackParamList = { Auth: undefined };
const RootStack = createNativeStackNavigator<RootStackParamList>();

// ─── JWT helper ───────────────────────────────────────────────────────────────

const decodeJwtRole = (token: string): string | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload as { role?: string }).role ?? null;
  } catch {
    return null;
  }
};

// ─── Teacher home screen (inline) ────────────────────────────────────────────

const TeacherHomeScreen: React.FC<{
  navigation: { navigate: (screen: keyof AttendanceStackParamList, params: object) => void };
}> = ({ navigation }) => {
  const [classId, setClassId] = useState('');

  const today = new Date();
  const date = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  return (
    <View style={homeStyles.container}>
      <Text style={homeStyles.title}>Take Attendance</Text>
      <Text style={homeStyles.label}>Class ID</Text>
      <TextInput
        style={homeStyles.input}
        placeholder="e.g. CLS-1A"
        value={classId}
        onChangeText={setClassId}
        autoCapitalize="characters"
      />
      <TouchableOpacity
        style={[homeStyles.btn, !classId && homeStyles.btnDisabled]}
        disabled={!classId}
        onPress={() =>
          navigation.navigate('AttendanceTaker', { classId: classId.trim(), date })
        }
      >
        <Text style={homeStyles.btnText}>Start</Text>
      </TouchableOpacity>
    </View>
  );
};

const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.paper,
    justifyContent: 'center',
    padding: 28,
  },
  title: { fontSize: 26, fontWeight: '700', color: TOKENS.ink, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: TOKENS.ink3, marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: TOKENS.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: TOKENS.ink,
    backgroundColor: TOKENS.surface,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: TOKENS.plum,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: '700', color: TOKENS.paper },
});

// ─── Nested stacks ────────────────────────────────────────────────────────────

const AttendanceStackScreen: React.FC<{ role: string | null }> = ({ role }) => (
  <AttendanceStack.Navigator screenOptions={{ headerShown: false }}>
    {role === 'student' ? (
      <AttendanceStack.Screen name="StudentAttendance" component={StudentAttendanceScreen} />
    ) : (
      <>
        <AttendanceStack.Screen
          name="TeacherHome"
          component={TeacherHomeScreen as React.ComponentType}
        />
        <AttendanceStack.Screen name="AttendanceTaker" component={AttendanceTakerScreen} />
        <AttendanceStack.Screen name="AttendanceReview" component={AttendanceReviewScreen} />
        <AttendanceStack.Screen name="StudentHub" component={StudentHubScreen} />
      </>
    )}
  </AttendanceStack.Navigator>
);

const AssignmentsStackScreen: React.FC = () => (
  <AssignmentsStack.Navigator screenOptions={{ headerShown: false }}>
    <AssignmentsStack.Screen name="AssignmentsList" component={AssignmentsScreen} />
    <AssignmentsStack.Screen name="AssignmentDetail" component={AssignmentDetailScreen} />
    <AssignmentsStack.Screen name="CreateAssignment" component={CreateAssignmentScreen} />
  </AssignmentsStack.Navigator>
);

const FeesStackScreen: React.FC = () => (
  <FeesStack.Navigator screenOptions={{ headerShown: false }}>
    <FeesStack.Screen name="Fees" component={FeesScreen} />
    <FeesStack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
  </FeesStack.Navigator>
);

const ChatStackScreen: React.FC = () => (
  <ChatStack.Navigator screenOptions={{ headerShown: false }}>
    <ChatStack.Screen name="Conversations" component={ChatConversationsScreen} />
    <ChatStack.Screen name="ChatRoom" component={ChatRoomScreen} />
  </ChatStack.Navigator>
);

const CalendarStackScreen: React.FC = () => (
  <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
    <CalendarStack.Screen name="Calendar" component={CalendarScreen} />
  </CalendarStack.Navigator>
);

// ─── Bottom tab navigator ─────────────────────────────────────────────────────

type TabParamList = {
  Attendance: undefined;
  Assignments: undefined;
  Fees: undefined;
  Chat: undefined;
  Calendar: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

type TabIconMap = Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']>;

const TAB_ICONS_INACTIVE: TabIconMap = {
  Attendance: 'clipboard-check-outline',
  Assignments: 'book-open-outline',
  Fees: 'credit-card-outline',
  Chat: 'chat-outline',
  Calendar: 'calendar-month-outline',
};

const TAB_ICONS_ACTIVE: TabIconMap = {
  Attendance: 'clipboard-check',
  Assignments: 'book-open-variant',
  Fees: 'credit-card',
  Chat: 'chat',
  Calendar: 'calendar-month',
};

const MainTabs: React.FC<{ token: string }> = ({ token }) => {
  const role = decodeJwtRole(token);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: TOKENS.plum,
        tabBarInactiveTintColor: TOKENS.ink3,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: TOKENS.line,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons
            name={
              focused
                ? TAB_ICONS_ACTIVE[route.name] ?? 'circle'
                : TAB_ICONS_INACTIVE[route.name] ?? 'circle-outline'
            }
            size={24}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Attendance" options={{ title: 'Attendance' }}>
        {() => <AttendanceStackScreen role={role} />}
      </Tab.Screen>
      <Tab.Screen
        name="Assignments"
        component={AssignmentsStackScreen}
        options={{ title: 'Assignments' }}
      />
      <Tab.Screen
        name="Fees"
        component={FeesStackScreen}
        options={{ title: 'Fees' }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStackScreen}
        options={{ title: 'Chat' }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarStackScreen}
        options={{ title: 'Calendar' }}
      />
    </Tab.Navigator>
  );
};

// ─── Root navigator ───────────────────────────────────────────────────────────

export const RootNavigator: React.FC = () => {
  const { token, hydrate } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrateAuth = async () => {
      await hydrate();
      setIsHydrated(true);
    };
    hydrateAuth();
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={TOKENS.plum} />
      </View>
    );
  }

  if (token) {
    return (
      <NavigationContainer>
        <MainTabs token={token} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Auth" component={AuthStack} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

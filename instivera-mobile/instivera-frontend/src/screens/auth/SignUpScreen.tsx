import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS } from '../../theme/tokens';
import { AuthStackParamList } from '../../navigation/types';
import { RegistrationFormData } from '../../types/registration';
import {
  useAcademicYears,
  usePrograms,
  useDepartments,
  useClasses,
  useFeeStructure,
  useSubmitRegistration,
} from '../../hooks/useRegistration';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;
type Step = 1 | 2 | 3 | 4 | 5;

// ─── Validation helpers ───────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const calcAge = (dob: string): number => {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
};

const padTwo = (v: string) => v.replace(/\D/g, '').slice(0, 2).padStart(2, '0');

// ─── InlinePicker (same pattern as CreateAssignmentScreen) ────────────────────

interface PickerItem { id: string; label: string }

const InlinePicker: React.FC<{
  label: string;
  placeholder: string;
  items: PickerItem[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}> = ({ label, placeholder, items, value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.id === value);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.pickerBtn, error ? styles.inputError : null]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.pickerBtnText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={TOKENS.ink3} />
      </TouchableOpacity>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={items}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.sheetItem, item.id === value && styles.sheetItemActive]}
                  onPress={() => { onChange(item.id); setOpen(false); }}
                >
                  <Text style={[styles.sheetItemText, item.id === value && styles.sheetItemTextActive]}>
                    {item.label}
                  </Text>
                  {item.id === value && (
                    <MaterialCommunityIcons name="check" size={16} color={TOKENS.plum} />
                  )}
                </TouchableOpacity>
              )}
              style={{ maxHeight: 300 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── Field wrapper ─────────────────────────────────────────────────────────────

const Field: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
  optional?: boolean;
}> = ({ label, error, children, optional }) => (
  <View style={styles.field}>
    <Text style={styles.label}>
      {label}
      {optional ? <Text style={styles.optionalTag}> (optional)</Text> : null}
    </Text>
    {children}
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
  </View>
);

// ─── Step header ──────────────────────────────────────────────────────────────

const StepHeader: React.FC<{
  step: Step;
  institutionName: string;
  onBack: () => void;
}> = ({ step, institutionName, onBack }) => (
  <View style={styles.stepHeader}>
    <TouchableOpacity onPress={onBack} hitSlop={8}>
      <MaterialCommunityIcons name="chevron-left" size={26} color={TOKENS.ink} />
    </TouchableOpacity>
    <View style={styles.stepHeaderCenter}>
      <Text style={styles.stepLabel}>Step {step} of 5</Text>
      <Text style={styles.stepInstitution} numberOfLines={1}>{institutionName}</Text>
      <View style={styles.dotsRow}>
        {([1, 2, 3, 4, 5] as Step[]).map((s) => (
          <View
            key={s}
            style={[styles.dot, s === step ? styles.dotActive : s < step ? styles.dotDone : styles.dotInactive]}
          />
        ))}
      </View>
    </View>
    <View style={{ width: 26 }} />
  </View>
);

// ─── Main screen ─────────────────────────────────────────────────────────────

export const SignUpScreen: React.FC<Props> = ({ route, navigation }) => {
  const { tenant, institutionName, institutionType } = route.params;

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<Partial<RegistrationFormData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationFormData | 'dob', string>>>({});

  // DOB split state
  const [dobDD, setDobDD] = useState('');
  const [dobMM, setDobMM] = useState('');
  const [dobYYYY, setDobYYYY] = useState('');
  const dobMMRef = useRef<TextInput>(null);
  const dobYYYYRef = useRef<TextInput>(null);

  const scrollRef = useRef<ScrollView>(null);

  // Hooks
  const { data: academicYears = [], isLoading: loadingYears } = useAcademicYears(tenant);
  const { data: programs = [], isLoading: loadingPrograms } = usePrograms(tenant);
  const { data: departments = [], isLoading: loadingDepts } = useDepartments(tenant);
  const { data: classes = [], isLoading: loadingClasses } = useClasses(tenant);
  const { data: feeStructure = [], isLoading: loadingFees } = useFeeStructure(tenant);
  const { mutate: submit, isPending: isSubmitting } = useSubmitRegistration();

  const set = <K extends keyof RegistrationFormData>(key: K, val: RegistrationFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // ─── Focus field tracking ─────────────────────────────────────────────────

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const inputStyle = (fieldKey: string, hasError?: boolean) => [
    styles.input,
    focusedField === fieldKey && styles.inputFocused,
    hasError && styles.inputError,
  ];

  // ─── Validation ───────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const e: typeof errors = {};
    const dob = dobDD && dobMM && dobYYYY
      ? `${dobYYYY}-${dobMM.padStart(2, '0')}-${dobDD.padStart(2, '0')}`
      : '';

    if (!formData.first_name || formData.first_name.trim().length < 2)
      e.first_name = 'Min 2 characters';
    if (!formData.last_name || formData.last_name.trim().length < 2)
      e.last_name = 'Min 2 characters';
    if (!dob) {
      e.dob = 'Date of birth is required';
    } else {
      const age = calcAge(dob);
      if (age < 5 || age > 40) e.dob = 'Age must be between 5 and 40 years';
    }
    if (!formData.gender) e.gender = 'Please select gender';
    if (!formData.mobile || !/^\d{10}$/.test(formData.mobile))
      e.mobile = 'Enter a valid 10-digit mobile number';
    if (!formData.email || !EMAIL_RE.test(formData.email))
      e.email = 'Enter a valid email address';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: typeof errors = {};
    if (!formData.academic_year_id) e.academic_year_id = 'Select academic year';
    if (!formData.class_id) e.class_id = 'Select a class';
    if (institutionType === 'college') {
      if (!formData.program_id) e.program_id = 'Select a program';
      if (!formData.department_id) e.department_id = 'Select a department';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = (): boolean => {
    const e: typeof errors = {};
    if (!formData.father_name || formData.father_name.trim().length < 2)
      e.father_name = 'Father\'s name is required (min 2 chars)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    let valid = true;
    if (step === 1) {
      // Merge DOB before validating
      if (dobDD && dobMM && dobYYYY) {
        const dob = `${dobYYYY}-${dobMM.padStart(2, '0')}-${dobDD.padStart(2, '0')}`;
        setFormData((prev) => ({ ...prev, date_of_birth: dob }));
      }
      valid = validateStep1();
    } else if (step === 2) valid = validateStep2();
    else if (step === 3) valid = validateStep3();

    if (!valid) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (step < 5) {
      setStep((s) => (s + 1) as Step);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleBack = () => {
    if (step === 1) navigation.goBack();
    else setStep((s) => (s - 1) as Step);
  };

  const handleSkip = () => {
    if (step < 5) setStep((s) => (s + 1) as Step);
    else handleSubmit();
  };

  const handleSubmit = () => {
    const dob = formData.date_of_birth ??
      (dobDD && dobMM && dobYYYY
        ? `${dobYYYY}-${dobMM.padStart(2, '0')}-${dobDD.padStart(2, '0')}`
        : '');

    const payload = { ...formData, date_of_birth: dob } as RegistrationFormData;

    submit(payload, {
      onSuccess: (res) => {
        navigation.navigate('RegistrationSuccess', {
          regId: res.registration_id,
          institutionName,
        });
      },
      onError: (err) => {
        Alert.alert(
          'Submission Failed',
          err instanceof Error ? err.message : 'Please try again.',
        );
      },
    });
  };

  // ─── Picker items ─────────────────────────────────────────────────────────

  const yearItems: PickerItem[] = academicYears.map((y) => ({
    id: String(y.id),
    label: y.name,
  }));
  const programItems: PickerItem[] = programs.map((p) => ({
    id: String(p.id),
    label: p.name,
  }));
  const deptItems: PickerItem[] = departments.map((d) => ({
    id: String(d.id),
    label: d.name,
  }));
  const classItems: PickerItem[] = classes.map((c) => ({
    id: String(c.id),
    label: c.name,
  }));

  // ─── Render steps ─────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Tell us about you</Text>

      {errors.first_name || errors.last_name || errors.dob || errors.gender || errors.mobile || errors.email
        ? <View style={styles.errorBanner}><Text style={styles.errorBannerText}>Please fix the errors below.</Text></View>
        : null}

      <Field label="First Name" error={errors.first_name}>
        <TextInput
          style={inputStyle('first_name', !!errors.first_name)}
          placeholder="First name"
          value={formData.first_name ?? ''}
          onChangeText={(v) => set('first_name', v)}
          autoCapitalize="words"
          onFocus={() => setFocusedField('first_name')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>

      <Field label="Last Name" error={errors.last_name}>
        <TextInput
          style={inputStyle('last_name', !!errors.last_name)}
          placeholder="Last name"
          value={formData.last_name ?? ''}
          onChangeText={(v) => set('last_name', v)}
          autoCapitalize="words"
          onFocus={() => setFocusedField('last_name')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>

      <Field label="Date of Birth" error={errors.dob}>
        <View style={styles.dobRow}>
          <TextInput
            style={[styles.dobInput, errors.dob ? styles.inputError : null]}
            placeholder="DD"
            keyboardType="numeric"
            maxLength={2}
            value={dobDD}
            onChangeText={(v) => {
              const d = v.replace(/\D/g, '').slice(0, 2);
              setDobDD(d);
              setErrors((prev) => ({ ...prev, dob: undefined }));
              if (d.length === 2) dobMMRef.current?.focus();
            }}
          />
          <Text style={styles.dobSep}>/</Text>
          <TextInput
            ref={dobMMRef}
            style={[styles.dobInput, errors.dob ? styles.inputError : null]}
            placeholder="MM"
            keyboardType="numeric"
            maxLength={2}
            value={dobMM}
            onChangeText={(v) => {
              const m = v.replace(/\D/g, '').slice(0, 2);
              setDobMM(m);
              setErrors((prev) => ({ ...prev, dob: undefined }));
              if (m.length === 2) dobYYYYRef.current?.focus();
            }}
          />
          <Text style={styles.dobSep}>/</Text>
          <TextInput
            ref={dobYYYYRef}
            style={[styles.dobInputYear, errors.dob ? styles.inputError : null]}
            placeholder="YYYY"
            keyboardType="numeric"
            maxLength={4}
            value={dobYYYY}
            onChangeText={(v) => {
              setDobYYYY(v.replace(/\D/g, '').slice(0, 4));
              setErrors((prev) => ({ ...prev, dob: undefined }));
            }}
          />
        </View>
      </Field>

      <Field label="Gender" error={errors.gender}>
        <View style={styles.genderRow}>
          {(['Male', 'Female', 'Other'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderBtn, formData.gender === g && styles.genderBtnActive]}
              onPress={() => { set('gender', g); }}
            >
              <Text style={[styles.genderBtnText, formData.gender === g && styles.genderBtnTextActive]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Mobile Number" error={errors.mobile}>
        <TextInput
          style={inputStyle('mobile', !!errors.mobile)}
          placeholder="10-digit mobile"
          keyboardType="phone-pad"
          maxLength={10}
          value={formData.mobile ?? ''}
          onChangeText={(v) => set('mobile', v.replace(/\D/g, '').slice(0, 10))}
          onFocus={() => setFocusedField('mobile')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>

      <Field label="Email Address" error={errors.email}>
        <TextInput
          style={inputStyle('email', !!errors.email)}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email ?? ''}
          onChangeText={(v) => set('email', v)}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>
    </>
  );

  const renderStep2 = () => {
    const loading = loadingYears || loadingClasses || loadingPrograms || loadingDepts;
    return (
      <>
        <Text style={styles.stepTitle}>Your academic details</Text>
        {loading && <ActivityIndicator color={TOKENS.plum} style={{ marginBottom: 16 }} />}
        {errors.academic_year_id || errors.class_id || errors.program_id || errors.department_id
          ? <View style={styles.errorBanner}><Text style={styles.errorBannerText}>Please select all required fields.</Text></View>
          : null}

        <InlinePicker
          label="Academic Year"
          placeholder="Select academic year"
          items={yearItems}
          value={formData.academic_year_id ? String(formData.academic_year_id) : ''}
          onChange={(id) => set('academic_year_id', Number(id))}
          error={errors.academic_year_id}
        />

        {institutionType === 'college' && (
          <>
            <InlinePicker
              label="Program"
              placeholder="Select program"
              items={programItems}
              value={formData.program_id ? String(formData.program_id) : ''}
              onChange={(id) => set('program_id', Number(id))}
              error={errors.program_id}
            />
            <InlinePicker
              label="Department"
              placeholder="Select department"
              items={deptItems}
              value={formData.department_id ? String(formData.department_id) : ''}
              onChange={(id) => set('department_id', Number(id))}
              error={errors.department_id}
            />
          </>
        )}

        <InlinePicker
          label={institutionType === 'college' ? 'Semester / Year' : 'Class'}
          placeholder="Select class"
          items={classItems}
          value={formData.class_id ? String(formData.class_id) : ''}
          onChange={(id) => {
            set('class_id', Number(id));
            // For school: auto-set program_id and department_id to 0 (defaults)
            if (institutionType === 'school') {
              setFormData((prev) => ({ ...prev, program_id: 0, department_id: 0 }));
            }
          }}
          error={errors.class_id}
        />
      </>
    );
  };

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Guardian information</Text>
      {errors.father_name
        ? <View style={styles.errorBanner}><Text style={styles.errorBannerText}>Father's name is required.</Text></View>
        : null}

      <Field label="Father's Name" error={errors.father_name}>
        <TextInput
          style={inputStyle('father_name', !!errors.father_name)}
          placeholder="Father's full name"
          autoCapitalize="words"
          value={formData.father_name ?? ''}
          onChangeText={(v) => set('father_name', v)}
          onFocus={() => setFocusedField('father_name')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>

      <Field label="Mother's Name" optional>
        <TextInput
          style={inputStyle('mother_name')}
          placeholder="Mother's full name"
          autoCapitalize="words"
          value={formData.mother_name ?? ''}
          onChangeText={(v) => set('mother_name', v)}
          onFocus={() => setFocusedField('mother_name')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>

      <Field label="Guardian Mobile" optional>
        <TextInput
          style={inputStyle('guardian_mobile')}
          placeholder="Guardian mobile number"
          keyboardType="phone-pad"
          maxLength={10}
          value={formData.guardian_mobile ?? ''}
          onChangeText={(v) => set('guardian_mobile', v.replace(/\D/g, '').slice(0, 10))}
          onFocus={() => setFocusedField('guardian_mobile')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>

      <Field label="Guardian Email" optional>
        <TextInput
          style={inputStyle('guardian_email')}
          placeholder="Guardian email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.guardian_email ?? ''}
          onChangeText={(v) => set('guardian_email', v)}
          onFocus={() => setFocusedField('guardian_email')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>
    </>
  );

  const renderStep4 = () => (
    <>
      <Text style={styles.stepTitle}>Your address</Text>
      <Text style={styles.stepSubtitle}>Optional — you can skip this</Text>

      <Field label="Address Line" optional>
        <TextInput
          style={inputStyle('address_line')}
          placeholder="House / Street / Area"
          autoCapitalize="words"
          value={formData.address_line ?? ''}
          onChangeText={(v) => set('address_line', v)}
          onFocus={() => setFocusedField('address_line')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>

      <Field label="City" optional>
        <TextInput
          style={inputStyle('city')}
          placeholder="City"
          autoCapitalize="words"
          value={formData.city ?? ''}
          onChangeText={(v) => set('city', v)}
          onFocus={() => setFocusedField('city')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>

      <Field label="State" optional>
        <TextInput
          style={inputStyle('state')}
          placeholder="State"
          autoCapitalize="words"
          value={formData.state ?? ''}
          onChangeText={(v) => set('state', v)}
          onFocus={() => setFocusedField('state')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>

      <Field label="PIN Code" optional>
        <TextInput
          style={inputStyle('pin_code')}
          placeholder="6-digit PIN"
          keyboardType="numeric"
          maxLength={6}
          value={formData.pin_code ?? ''}
          onChangeText={(v) => set('pin_code', v.replace(/\D/g, '').slice(0, 6))}
          onFocus={() => setFocusedField('pin_code')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>
    </>
  );

  const renderStep5 = () => {
    const registrationFee = feeStructure.find(
      (f) => f.fee_type === 'REGISTRATION' || f.fee_type === 'REGISTRATION_FEE',
    );
    return (
      <>
        <Text style={styles.stepTitle}>Previous education</Text>
        <Text style={styles.stepSubtitle}>Optional — helps the institution</Text>

        <Field label="Previous School / College Name" optional>
          <TextInput
            style={inputStyle('previous_school_name')}
            placeholder="Name of last institution"
            autoCapitalize="words"
            value={formData.previous_school_name ?? ''}
            onChangeText={(v) => set('previous_school_name', v)}
            onFocus={() => setFocusedField('previous_school_name')}
            onBlur={() => setFocusedField(null)}
          />
        </Field>

        <Field label="Last Class / Year Passed" optional>
          <TextInput
            style={inputStyle('last_class_passed')}
            placeholder="e.g. Class 10, HSC"
            value={formData.last_class_passed ?? ''}
            onChangeText={(v) => set('last_class_passed', v)}
            onFocus={() => setFocusedField('last_class_passed')}
            onBlur={() => setFocusedField(null)}
          />
        </Field>

        <Field label="Board / University (10th)" optional>
          <TextInput
            style={inputStyle('board_university_10th')}
            placeholder="e.g. CBSE, State Board"
            value={formData.board_university_10th ?? ''}
            onChangeText={(v) => set('board_university_10th', v)}
            onFocus={() => setFocusedField('board_university_10th')}
            onBlur={() => setFocusedField(null)}
          />
        </Field>

        <Field label="Percentage (10th)" optional>
          <TextInput
            style={inputStyle('ten_percentage')}
            placeholder="e.g. 85.5"
            keyboardType="decimal-pad"
            value={formData.ten_percentage ?? ''}
            onChangeText={(v) => set('ten_percentage', v)}
            onFocus={() => setFocusedField('ten_percentage')}
            onBlur={() => setFocusedField(null)}
          />
        </Field>

        <Field label="Year of Passing (10th)" optional>
          <TextInput
            style={inputStyle('year_of_passing_10th')}
            placeholder="e.g. 2022"
            keyboardType="numeric"
            maxLength={4}
            value={formData.year_of_passing_10th ?? ''}
            onChangeText={(v) => set('year_of_passing_10th', v.replace(/\D/g, '').slice(0, 4))}
            onFocus={() => setFocusedField('year_of_passing_10th')}
            onBlur={() => setFocusedField(null)}
          />
        </Field>

        {/* Fee summary card */}
        {!loadingFees && feeStructure.length > 0 && (
          <View style={styles.feeCard}>
            <Text style={styles.feeCardTitle}>Fees Overview</Text>
            {feeStructure.map((fee) => (
              <View key={fee.fee_type} style={styles.feeRow}>
                <Text style={styles.feeLabel}>{fee.description}</Text>
                <Text style={styles.feeAmount}>
                  ₹{fee.amount} {fee.currency}
                </Text>
              </View>
            ))}
            {registrationFee && (
              <Text style={styles.feeNote}>
                ₹{registrationFee.amount} registration fee payable after submission
              </Text>
            )}
            <Text style={styles.feeDisclaimer}>
              Your application will be reviewed. App access is granted only after admin approval.
            </Text>
          </View>
        )}
      </>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StepHeader step={step} institutionName={institutionName} onBack={handleBack} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}

          {/* CTA buttons */}
          <View style={styles.ctaRow}>
            {(step === 4 || step === 5) && (
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} disabled={isSubmitting}>
                <Text style={styles.skipBtnText}>{step === 5 ? 'Skip & Submit' : 'Skip'}</Text>
              </TouchableOpacity>
            )}

            {step < 5 ? (
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Next</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Submit Application</Text>
                    <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOKENS.paper },
  flex: { flex: 1 },

  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: TOKENS.paper,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line,
  },
  stepHeaderCenter: { flex: 1, alignItems: 'center' },
  stepLabel: { fontSize: 11, color: TOKENS.ink3, letterSpacing: 0.5 },
  stepInstitution: { fontSize: 13, fontWeight: '600', color: TOKENS.ink, marginTop: 2 },
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: TOKENS.plum, width: 20 },
  dotDone: { backgroundColor: TOKENS.plum300 },
  dotInactive: { backgroundColor: TOKENS.line2 },

  scrollContent: { padding: 24, paddingBottom: 40 },

  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TOKENS.ink,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: TOKENS.ink3,
    marginBottom: 20,
  },

  errorBanner: {
    backgroundColor: TOKENS.redTint,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: { color: TOKENS.red, fontSize: 13, fontWeight: '500' },

  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: TOKENS.ink, marginBottom: 8 },
  optionalTag: { fontWeight: '400', color: TOKENS.ink3 },
  fieldError: { fontSize: 11, color: TOKENS.red, marginTop: 4 },

  input: {
    borderWidth: 1,
    borderColor: TOKENS.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: TOKENS.ink,
    backgroundColor: TOKENS.surface,
  },
  inputFocused: { borderColor: TOKENS.plum },
  inputError: { borderColor: TOKENS.red },

  dobRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dobInput: {
    borderWidth: 1,
    borderColor: TOKENS.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: TOKENS.ink,
    backgroundColor: TOKENS.surface,
    width: 60,
    textAlign: 'center',
  },
  dobInputYear: {
    borderWidth: 1,
    borderColor: TOKENS.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: TOKENS.ink,
    backgroundColor: TOKENS.surface,
    width: 90,
    textAlign: 'center',
  },
  dobSep: { fontSize: 20, color: TOKENS.ink3, marginHorizontal: 2 },

  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: TOKENS.line,
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
  },
  genderBtnActive: { borderColor: TOKENS.plum, backgroundColor: TOKENS.plumTint },
  genderBtnText: { fontSize: 14, fontWeight: '600', color: TOKENS.ink3 },
  genderBtnTextActive: { color: TOKENS.plum },

  pickerBtn: {
    borderWidth: 1,
    borderColor: TOKENS.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: TOKENS.surface,
  },
  pickerBtnText: { fontSize: 16, color: TOKENS.ink, flex: 1 },
  placeholder: { color: TOKENS.ink3 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: TOKENS.ink, marginBottom: 12 },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line2,
  },
  sheetItemActive: { backgroundColor: TOKENS.plumTint },
  sheetItemText: { flex: 1, fontSize: 15, color: TOKENS.ink },
  sheetItemTextActive: { fontWeight: '700', color: TOKENS.plum },

  feeCard: {
    backgroundColor: TOKENS.plumTint,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  feeCardTitle: { fontSize: 14, fontWeight: '700', color: TOKENS.plum, marginBottom: 4 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeLabel: { fontSize: 13, color: TOKENS.ink2 },
  feeAmount: { fontSize: 13, fontWeight: '700', color: TOKENS.plum },
  feeNote: { fontSize: 12, color: TOKENS.plum, fontWeight: '600', marginTop: 4 },
  feeDisclaimer: { fontSize: 11, color: TOKENS.ink3, lineHeight: 16, marginTop: 4 },

  ctaRow: { marginTop: 8, gap: 10 },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipBtnText: { fontSize: 14, color: TOKENS.ink3, fontWeight: '500' },
  nextBtn: {
    backgroundColor: TOKENS.plum,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TOKENS.coral,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

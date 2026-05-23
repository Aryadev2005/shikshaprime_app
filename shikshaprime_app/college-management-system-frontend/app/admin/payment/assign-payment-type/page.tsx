"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import useRoleGuard from "@/src/hooks/useRoleGuard";
import { useNotify } from "@/src/context/notificationContext";
import { useApi } from "@/src/hooks/useApi";
import {
  getActivePaymentTypes,
  assignPayment,
} from "@/src/services/paymentService";
import { fetchAcademicYears, fetchClasses, fetchLevelTwoDepartments, fetchPrograms } from "@/src/services/CommonService";
import { searchStudents, getStudentsByClass } from "@/src/services/studentService";
import { PaymentType, AssignPaymentPayload } from "@/src/types/paymentTypes";
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Users,
  CreditCard,
  Search,
  X,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import "./assign-payment-type.css";
import Link from "next/link";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ClassOption {
  id: number;
  code: string;  
  name?: string;
}

interface ProgramOption {
  id: number;
  code: string;  
  name?: string;
}

interface DepartmentOption {
  id: number;
  code: string;  
  name?: string;
}

interface AcademicYearOption {
  id: number;
  name?: string;
}

interface StudentOption {
  id: number;
  student_id: string;
  student_name: string;
  roll_number?: string;
  class_id?: number;
}

export default function AssignPaymentTypePage() {
  const user = useRoleGuard("admin");
  const router = useRouter();
  const notify = useNotify();

  // API hooks
  const getPaymentTypesApi = useApi(getActivePaymentTypes);
  const fetchProgramsApi = useApi(fetchPrograms);
  const fetchDepartmentsApi = useApi(fetchLevelTwoDepartments);
  const fetchClassesApi = useApi(fetchClasses);
  const fetchAcademicYearsApi = useApi(fetchAcademicYears);
  const searchStudentsApi = useApi(searchStudents);
  const getStudentsByClassApi = useApi(getStudentsByClass);
  const assignPaymentApi = useApi(assignPayment);

  // Data State
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<StudentOption[]>([]);

  // Search State (for "By Student" mode)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<StudentOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Form State
  const [assignBy, setAssignBy] = useState<"class" | "student">("class");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split("T")[0];
  });
  const [status, setStatus] = useState<string>("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch students when class is selected (By Class mode)
  useEffect(() => {
    if (assignBy === "class" && selectedClass && selectedProgram && selectedDepartment && selectedAcademicYear) {
      fetchStudentsByClassFn(selectedProgram, selectedDepartment, selectedAcademicYear, selectedClass);      
    } else if (assignBy === "class") {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [assignBy, selectedClass, selectedProgram, selectedDepartment, selectedAcademicYear]);

  // Reset selections when switching modes
  useEffect(() => {
    setSelectedStudents([]);
    setStudents([]);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedClass("");
    setSelectedProgram("");
    setSelectedDepartment("");
    setSelectedAcademicYear("");
  }, [assignBy]);

  const fetchInitialData = async () => {
    try {
      const [paymentTypesResult, classesResult, programsResult, departmentsResult, academicYearResult] = await Promise.all([
        getPaymentTypesApi.call(),
        fetchClassesApi.call(),
        fetchProgramsApi.call(),
        fetchDepartmentsApi.call(),
        fetchAcademicYearsApi.call()
      ]);

      console.log("Payment Types Result:", paymentTypesResult);
      console.log("Classes Result (RAW):", JSON.stringify(classesResult, null, 2));

      if (paymentTypesResult.status === 1) {
        setPaymentTypes(paymentTypesResult.data || []);
      }

      if (programsResult.status === 1) {
        const programsData = (programsResult.data || []).map((program: any) => ({
          id: program.id,
          name: program.name,
          code: program.code
        }));
        console.log("Mapped Programs for dropdown:", programsData);
        setPrograms(programsData);
      } else {
        console.error("programs API returned error status:", programsResult);
      }

      if (departmentsResult.status === 1) {
        const departmentData = (departmentsResult.data || []).map((dept: any) => ({
          id: dept.id,
          name: dept.name,
          code: dept.code
        }));
        console.log("Mapped Departments for dropdown:", departmentData);
        setDepartments(departmentData);
      } else {
        console.error("Departments API returned error status:", departmentsResult);
      }

      if (academicYearResult.status === 1) {
        const academicYearData = (academicYearResult.data || []).map((academicYear: any) => ({
          id: academicYear.id,
          name: academicYear.name
        }));
        console.log("Mapped Departments for dropdown:", academicYearData);
        setAcademicYears(academicYearData);
      } else {
        console.error("Academic Years API returned error status:", academicYearResult);
      }

      if (classesResult.status === 1) {
        // Map the response to ensure we have the right structure
        const classesData = (classesResult.data || []).map((cls: any) => ({
          id: cls.id,
          name: cls.name || cls.class_name,
          code: cls.code
        }));
        console.log("Mapped Classes for dropdown:", classesData);
        setClasses(classesData);
      } else {
        console.error("Classes API returned error status:", classesResult);
      }
    } catch (err) {
      console.error("Error fetching initial data:", err);
      notify.error("Error", "Failed to load data");
    }
  };

  const fetchStudentsByClassFn = async (programId: string, departmentId: string, academicYearId: string, classId: string) => {
    try {
      const result = await getStudentsByClassApi.call(programId, departmentId, academicYearId, classId);
      if (result.status === 1) {
        const studentsList = result.data || [];
        setStudents(studentsList);
        // Auto-select all students when fetching by class
        setSelectedStudents(studentsList);
      } else {
        setStudents([]);
        setSelectedStudents([]);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      notify.error("Error", "Failed to fetch students");
      setStudents([]);
      setSelectedStudents([]);
    }
  };

  // Debounced search for students
  const handleSearchStudents = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      setShowSearchResults(true);

      try {
        const result = await searchStudentsApi.call({ 
          query: query,
          status: "1" 
        });
        
        if (result.count > 0) {
          // Filter out already selected students
          const selectedIds = selectedStudents.map(s => s.id);
          const filtered = (result.data || []).filter(
            (s: StudentOption) => !selectedIds.includes(s.id)
          );
          setSearchResults(filtered);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Error searching students:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [selectedStudents]
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (assignBy === "student") {
        handleSearchStudents(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, assignBy, handleSearchStudents]);

  const handleAddStudent = (student: StudentOption) => {
    if (!selectedStudents.find(s => s.id === student.id)) {
      setSelectedStudents(prev => [...prev, student]);
    }
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleRemoveStudent = (studentId: number) => {
    setSelectedStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleStudentToggle = (student: StudentOption) => {
    const isSelected = selectedStudents.some(s => s.id === student.id);
    if (isSelected) {
      setSelectedStudents(prev => prev.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents(prev => [...prev, student]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents([...students]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (assignBy === "class" && !selectedClass) {
      notify.warning("Validation Error", "Please select a class");
      return;
    }
    if (!selectedPaymentType) {
      notify.warning("Validation Error", "Please select a payment type");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      notify.warning("Validation Error", "Please enter a valid amount");
      return;
    }
    if (!dueDate) {
      notify.warning("Validation Error", "Please select a due date");
      return;
    }
    if (selectedStudents.length === 0) {
      notify.warning("Validation Error", "Please select at least one student");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: AssignPaymentPayload = {
        student_ids: selectedStudents.map(s => s.id),
        payment_type_id: parseInt(selectedPaymentType),
        amount: parseFloat(amount),
        due_date: dueDate,
        status: status as any,
      };

      const result = await assignPaymentApi.call(payload);

      if (result.status === 1) {
        notify.success(
          "Success",
          `Payment assigned to ${selectedStudents.length} student(s) successfully`
        );
        handleReset();
      } else {
        notify.error("Error", result.message || "Failed to assign payment");
      }
    } catch (err) {
      console.error("Error assigning payment:", err);
      notify.error("Error", "Failed to assign payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAssignBy("class");
    setSelectedClass("");
    setSelectedProgram("");
    setSelectedDepartment("");
    setSelectedAcademicYear("");
    setSelectedPaymentType("");
    setAmount("");
    setDueDate(() => {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date.toISOString().split("T")[0];
    });
    setStatus("pending");
    setStudents([]);
    setSelectedStudents([]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const getClassName = (cls: ClassOption) => {
    return cls.name || `Class ${cls.id}`;
  };

  if (!user) return null;

  return (
    <div className="assign-payment-container">
      {/* Back Button & Header */}
      <div className="page-header-row">
        {/* <button className="back-button" onClick={() => router.push("/admin/payment")}>
          <ArrowLeft size={18} />
        </button> */}
        <div className="flex items-center mb-3">
          <Link href={'/admin/payment'} className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center"><ChevronLeft className="h-5 w-5" /></Link>
        </div>
        <div className="page-header-text">
          <h1 className="text-md text-dark font-bold">Assign Payment Type to Students</h1>
          <p className="page-subtitle">
            Assign payment types to students by class or individually
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="assign-payment-grid">
        {/* Left: Assignment Form */}
        <div className="card-white">
          <div className="card-header">
            <CreditCard size={20} />
            <span>Assignment Form</span>
          </div>

          <form onSubmit={handleSubmit} className="assignment-form">
            {/* Assign By */}
            <div className="form-group">
              <Label>Assign By <span className="required">*</span></Label>
              <div className="radio-group">
                <label className="radio-label">
                  <Input type="radio" name="assignBy" value="class" checked={assignBy === "class"} onChange={() => setAssignBy("class")}/>
                  <span>By Class</span>
                </label>
                <Label className="radio-label">
                  <Input type="radio" name="assignBy" value="student" checked={assignBy === "student"} onChange={() => setAssignBy("student")}/>
                  <span>By Student</span>
                </Label>
              </div>
            </div>

            {/* Select Program, Department, Academic Year and Class - Only show when "By Class" is selected */}
            <div className="md:grid-cols-2 grid grid-cols-1 gap-3 gap-y-0">
              {assignBy === "class" && (
                <div className="form-group">
                  <Label htmlFor="programs">Select Program <span className="required">*</span></Label>
                  <select id="program" className="form-select" value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}>
                    <option value="">Choose a program...</option>
                    {programs.map((prg) => (
                      <option key={prg.id} value={prg.id}>
                        {prg.name}
                      </option>
                    ))}
                  </select>
                  {fetchProgramsApi.loading && (
                    <span className="loading-text">Loading programs...</span>
                  )}
                </div>
              )}
              {assignBy === "class" && (
                <div className="form-group">
                  <Label htmlFor="departments">Select Department <span className="required">*</span></Label>
                  <select id="department" className="form-select" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                    <option value="">Choose a department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {fetchDepartmentsApi.loading && (
                    <span className="loading-text">Loading departments...</span>
                  )}
                </div>
              )}
              {assignBy === "class" && (
                <div className="form-group">
                  <Label htmlFor="class">
                    Select Class <span className="required">*</span>
                  </Label>
                  <select
                    id="class"
                    className="form-select"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="">Choose a class...</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {getClassName(cls)}
                      </option>
                    ))}
                  </select>
                  {fetchClassesApi.loading && (
                    <span className="loading-text">Loading classes...</span>
                  )}
                </div>
              )}
              {assignBy === "class" && (
                <div className="form-group">
                  <Label htmlFor="academicYears" >
                    Select Academic Year <span className="required">*</span>
                  </Label>
                  <select
                    id="academicYear"
                    className="form-select"
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  >
                    <option value="">Choose a academic year...</option>
                    {academicYears.map((acyr) => (
                      <option key={acyr.id} value={acyr.id}>
                        {acyr.name}
                      </option>
                    ))}
                  </select>
                  {fetchAcademicYearsApi.loading && (
                    <span className="loading-text">Loading academic years...</span>
                  )}
                </div>
              )}
              {/* Search Students - Only show when "By Student" is selected */}
              {assignBy === "student" && (
                <div className="form-group">
                  <Label >
                    Search Students <span className="required">*</span>
                  </Label>
                  <div className="search-container">
                    <div className="search-input-wrapper">
                      <Search size={18} className="search-icon" />
                      <Input
                        type="text"
                        className="form-input search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by student name or student id"
                        onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                      />
                      {isSearching && (
                        <Loader2 size={18} className="search-loader" />
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="search-results">
                        {searchResults.map((student) => (
                          <div
                            key={student.id}
                            className="search-result-item"
                            onClick={() => handleAddStudent(student)}
                          >
                            <div className="student-info">
                              <span className="student-name">{student.student_name}</span>
                              <span className="student-id">
                                {student.student_id}
                                {student.roll_number && ` • Roll: ${student.roll_number}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {showSearchResults && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                      <div className="search-results">
                        <div className="search-no-results">No students found</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Payment Type */}
              <div className="form-group">
                <label htmlFor="paymentType">
                  Payment Type <span className="required">*</span>
                </label>
                <select
                  id="paymentType"
                  className="form-select"
                  value={selectedPaymentType}
                  onChange={(e) => setSelectedPaymentType(e.target.value)}
                >
                  <option value="">Choose payment type...</option>
                  {paymentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Amount */}
              <div className="form-group">
                <label htmlFor="amount">
                  Amount (₹) <span className="required">*</span>
                </label>
                <Input
                  type="number"
                  id="amount"
                  className="form-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>
              {/* Due Date */}
              <div className="form-group">
                <label htmlFor="dueDate">
                  Payment Due Date <span className="required">*</span>
                </label>
                <Input
                  type="date"
                  id="dueDate"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              {/* Status */}
              <div className="form-group">
                <label htmlFor="status">
                  Status <span className="required">*</span>
                </label>
                <select
                  id="status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>





            {/* Form Actions */}
            <div className="form-actions">
              <Button
                type="submit"
                // className="btn-primary"
                disabled={isSubmitting}
                variant="primary"
              >
                <Save size={16} />
                <span>{isSubmitting ? "Assigning..." : "Assign Payment"}</span>
              </Button>
              <Button
                type="button"
                // className="btn-reset"
                onClick={handleReset}
                variant="ghost"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Right: Students List */}
        <div className="card-white">
          <div className="card-header">
            <Users size={20} />
            <span>
              {assignBy === "class" ? "Students in Selected Class" : "Selected Students"}
            </span>
          </div>

          <div className="students-list-container">
            {/* By Class Mode */}
            {assignBy === "class" && (
              <>
                {!selectedClass ? (
                  <div className="empty-state info">
                    Select a class to view students
                  </div>
                ) : getStudentsByClassApi.loading ? (
                  <div className="empty-state">
                    <Loader2 size={24} className="spinner" />
                    <span>Loading students...</span>
                  </div>
                ) : students.length === 0 ? (
                  <div className="empty-state info">
                    No students found in this class
                  </div>
                ) : (
                  <>
                    {/* Select All Header */}
                    <div className="students-header">
                      <label className="checkbox-label select-all">
                        <input
                          type="checkbox"
                          checked={
                            selectedStudents.length === students.length &&
                            students.length > 0
                          }
                          onChange={handleSelectAll}
                        />
                        <span>
                          Select All ({selectedStudents.length}/{students.length})
                        </span>
                      </label>
                    </div>

                    {/* Students List */}
                    <div className="students-list">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className={`student-item ${
                            selectedStudents.some(s => s.id === student.id) ? "selected" : ""
                          }`}
                          onClick={() => handleStudentToggle(student)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.some(s => s.id === student.id)}
                            onChange={() => handleStudentToggle(student)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="student-info">
                            <span className="student-name">{student.student_name}</span>
                            <span className="student-id">
                              {student.student_id}
                              {student.roll_number && ` • Roll: ${student.roll_number}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* By Student Mode */}
            {assignBy === "student" && (
              <>
                {selectedStudents.length === 0 ? (
                  <div className="empty-state info">
                    Search and select students to assign payment
                  </div>
                ) : (
                  <>
                    <div className="students-header">
                      <span className="selected-count">
                        {selectedStudents.length} student(s) selected
                      </span>
                      <button
                        type="button"
                        className="btn-clear-all"
                        onClick={() => setSelectedStudents([])}
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="students-list">
                      {selectedStudents.map((student) => (
                        <div key={student.id} className="student-item selected">
                          <div className="student-info">
                            <span className="student-name">{student.student_name}</span>
                            <span className="student-id">
                              {student.student_id}
                              {student.roll_number && ` • Roll: ${student.roll_number}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn-remove-student"
                            onClick={() => handleRemoveStudent(student.id)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

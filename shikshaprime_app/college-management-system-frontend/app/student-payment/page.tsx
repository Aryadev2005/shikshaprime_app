"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  getPublicPaymentTypes,
  initiatePublicStudentPayment,
  isSuccessStatus,
  lookupPublicStudentPayment,
  type PublicPaymentType,
  type PublicStudentPaymentLookup,
} from "@/src/services/paymentService";
import "./student-payment.css";

const paymentFormSchema = z.object({
  paymentTypeId: z.string().min(1, "Payment Type is required"),
  remarks: z.string().optional(),
  paymentMethod: z.string(),
  identifier: z.string().min(1, "Identifier is required"),
  studentName: z.string().optional(),
  className: z.string().optional(),
  semester: z.string().optional(),
  program: z.string().optional(),
  department: z.string().optional(),
  mobileNumber: z.string().optional(),
  emailId: z.string().optional(),
  academicYear: z.string().optional(),
  agreed: z.boolean().refine((value) => value === true, {
    message: "You must agree to continue",
  }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

type AlertState =
  | {
    type: "error" | "info" | "success";
    message: string;
  }
  | null;

type ResolvedStudent = PublicStudentPaymentLookup["student"] | null;
type ResolvedPayment = NonNullable<PublicStudentPaymentLookup["payment"]> | null;

const resolvedFieldNames: Array<keyof PaymentFormValues> = [
  "studentName",
  "className",
  "semester",
  "program",
  "department",
  "mobileNumber",
  "emailId",
  "academicYear",
];

function formatInrAmount(amount?: number | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function getLookupErrorMessage(isRegistrationLookup: boolean) {
  return isRegistrationLookup
    ? "Student not found with the provided Registration Number"
    : "Student not found with the provided Student ID";
}

function getInitiationErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Failed to initiate payment";

  if (message.includes("Payment already completed")) {
    return "Payment already completed";
  }

  if (message.includes("Amount not set")) {
    return "Amount not set for selected payment type";
  }

  if (message.includes("Payment setup is not ready")) {
    return "Payment setup is not ready for this student. Please try again.";
  }

  return "Failed to initiate payment";
}

function StudentPaymentContent() {
  const searchParams = useSearchParams();
  const previousPaymentTypeRef = useRef<string>("");
  const skipNextLookupRef = useRef(false);

  const [paymentTypes, setPaymentTypes] = useState<PublicPaymentType[]>([]);
  const [paymentTypeLoading, setPaymentTypeLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [resolvedStudent, setResolvedStudent] = useState<ResolvedStudent>(null);
  const [resolvedPayment, setResolvedPayment] = useState<ResolvedPayment>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentTypeId: "",
      remarks: "",
      paymentMethod: "Online / UPI",
      identifier: "",
      studentName: "",
      className: "",
      semester: "",
      program: "",
      department: "",
      mobileNumber: "",
      emailId: "",
      academicYear: "",
      agreed: false,
    },
  });

  const selectedPaymentTypeId = watch("paymentTypeId");
  const identifier = watch("identifier");

  const selectedPaymentType = useMemo(
    () => paymentTypes.find((paymentType) => String(paymentType.id) === selectedPaymentTypeId) || null,
    [paymentTypes, selectedPaymentTypeId]
  );

  const isRegistrationLookup = useMemo(() => {
    const name = selectedPaymentType?.name?.toLowerCase() || "";
    return name.includes("registration") || name.includes("admission");
  }, [selectedPaymentType]);

  const identifierLabel = isRegistrationLookup ? "Reg. No" : "Student Id";

  const payableAmount = useMemo(() => {
    if (resolvedPayment) {
      return Math.max(Number(resolvedPayment.amount || 0) - Number(resolvedPayment.paid_amount || 0), 0);
    }
    if (selectedPaymentType) {
      return Number(selectedPaymentType.amount || 0);
    }
    return 0;
  }, [resolvedPayment, selectedPaymentType]);

  const clearResolvedData = (keepIdentifier = true) => {
    setResolvedStudent(null);
    setResolvedPayment(null);

    if (!keepIdentifier) {
      setValue("identifier", "");
    }

    resolvedFieldNames.forEach((fieldName) => setValue(fieldName, ""));
    clearErrors(resolvedFieldNames);
  };

  useEffect(() => {
    const queryPaymentTypeId = searchParams.get("paymentTypeId");
    const queryIdentifier =
      searchParams.get("identifier") ||
      searchParams.get("regNo") ||
      searchParams.get("studentId");

    if (queryPaymentTypeId) {
      setValue("paymentTypeId", queryPaymentTypeId);
    }

    if (queryIdentifier) {
      setValue("identifier", queryIdentifier);
    }
  }, [searchParams, setValue]);

  useEffect(() => {
    let isCancelled = false;

    const loadPaymentTypes = async () => {
      setPaymentTypeLoading(true);

      try {
        const response = await getPublicPaymentTypes();
        const types = response.data || [];

        if (!isSuccessStatus(response.status) || types.length === 0) {
          throw new Error(
            response.message ||
            "Payment types are not available right now. Please refresh the page or contact the office."
          );
        }

        if (!isCancelled) {
          setPaymentTypes(types);
          setAlert(null);
        }
      } catch {
        if (!isCancelled) {
          setPaymentTypes([]);
          setAlert({
            type: "error",
            message:
              "Payment types are not available right now. Please refresh the page or contact the office.",
          });
        }
      } finally {
        if (!isCancelled) {
          setPaymentTypeLoading(false);
        }
      }
    };

    loadPaymentTypes();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (previousPaymentTypeRef.current && previousPaymentTypeRef.current !== selectedPaymentTypeId) {
      clearResolvedData(false);
      setAlert(null);
      skipNextLookupRef.current = true;
    }

    previousPaymentTypeRef.current = selectedPaymentTypeId;
    setValue("paymentMethod", "Online / UPI");
  }, [selectedPaymentTypeId, setValue]);

  useEffect(() => {
    if (skipNextLookupRef.current) {
      skipNextLookupRef.current = false;
      return;
    }

    const trimmedIdentifier = identifier.trim();

    if (!selectedPaymentTypeId) {
      clearResolvedData(true);
      return;
    }

    if (!trimmedIdentifier) {
      clearResolvedData(true);
      return;
    }

    const debounceHandle = window.setTimeout(async () => {
      setLookupLoading(true);
      setAlert(null);

      try {
        const response = await lookupPublicStudentPayment({
          identifier: trimmedIdentifier,
          lookupType: isRegistrationLookup ? "registration" : "student_id",
          paymentTypeId: Number(selectedPaymentTypeId),
        });

        if (!isSuccessStatus(response.status) || !response.data?.student) {
          throw new Error(response.message || getLookupErrorMessage(isRegistrationLookup));
        }

        const student = response.data.student;
        const payment = response.data.payment || null;
        const paymentTypeAmount = Number(response.data.paymentType?.amount || 0);

        setResolvedStudent(student);
        setResolvedPayment(payment);

        setValue("studentName", student.student_name || "");
        setValue("className", student.class_name || "");
        setValue("semester", student.semester || "");
        setValue("program", student.program || "");
        setValue("department", student.department || "");
        setValue("mobileNumber", student.mobile || "");
        setValue("emailId", student.email || "");
        setValue("academicYear", student.academic_year || "");

        if (!payment) {
          setAlert({
            type: "error",
            message:
              paymentTypeAmount > 0
                ? "Payment setup is not ready for this student. Please try again."
                : "Amount not set for selected payment type",
          });
          return;
        }

        const remainingAmount = Number(payment.amount || 0) - Number(payment.paid_amount || 0);

        if (payment.status === "paid" || remainingAmount <= 0) {
          setAlert({ type: "info", message: "Payment already completed" });
        }
      } catch (error: any) {
        clearResolvedData(true);
        setAlert({
          type: "error",
          message: error.message || getLookupErrorMessage(isRegistrationLookup),
        });
      } finally {
        setLookupLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(debounceHandle);
    };
  }, [identifier, isRegistrationLookup, selectedPaymentTypeId, setValue]);

  const onSubmit = async (formValues: PaymentFormValues) => {
    if (!resolvedStudent) {
      setAlert({
        type: "error",
        message: getLookupErrorMessage(isRegistrationLookup),
      });
      return;
    }

    if (!resolvedPayment) {
      setAlert({
        type: "error",
        message: "Payment setup is not ready for this student. Please try again.",
      });
      return;
    }

    const remainingAmount = Number(resolvedPayment.amount || 0) - Number(resolvedPayment.paid_amount || 0);

    if (resolvedPayment.status === "paid" || remainingAmount <= 0) {
      setAlert({ type: "info", message: "Payment already completed" });
      return;
    }

    try {
      setSubmitting(true);
      setAlert(null);

      const response = await initiatePublicStudentPayment({
        paymentId: resolvedPayment.payment_id,
        amount: remainingAmount,
        remarks: formValues.remarks?.trim() || "",
      });

      if (!isSuccessStatus(response.status) || !response.data?.redirectUrl) {
        throw new Error(response.message || "Failed to initiate payment");
      }

      window.location.href = response.data.redirectUrl;
    } catch (error) {
      const message = getInitiationErrorMessage(error);
      setAlert({ type: "error", message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="student-payment-board">
      {(paymentTypeLoading || lookupLoading || submitting) && <Loader />}

      <div className="student-payment-shell">
        <div className="payment-header-container">
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/images/logo.svg`}
            alt="ShikshaPrime"
            width={220}
            height={64}
            className="logo-small"
          />
          <h1 className="page-title">Student Payment</h1>
        </div>

        <div className="payment-card">
          <form onSubmit={handleSubmit(onSubmit)} className="student-payment-form">
            {alert && (
              <div className={`payment-alert payment-alert-${alert.type}`}>
                {alert.message}
              </div>
            )}

            <section className="payment-section">
              <div className="section-heading">
                <h2>Payment Details</h2>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="custom-label">
                    Payment Type <span className="required">*</span>
                  </label>
                  <div className="custom-select-wrapper">
                    <select
                      {...register("paymentTypeId")}
                      className={`custom-select-pay ${errors.paymentTypeId ? "input-error" : ""}`}
                    >
                      <option value="">Select Payment Type</option>
                      {paymentTypes.map((paymentType) => (
                        <option key={paymentType.id} value={paymentType.id}>
                          {paymentType.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.paymentTypeId && (
                    <span className="field-error">{errors.paymentTypeId.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="custom-label">Remarks (Optional)</label>
                  <Input
                    {...register("remarks")}
                    className="custom-input-pay"
                    placeholder="Enter remarks"
                  />
                </div>

                <div className="form-group">
                  <label className="custom-label">Payment Method</label>
                  <Input
                    {...register("paymentMethod")}
                    className="custom-input-pay readonly-input"
                    readOnly
                  />
                </div>
              </div>

              {selectedPaymentTypeId && (
                <div className="amount-panel">
                  <span className="amount-label">Amount Payable</span>
                  <span className="amount-value">{formatInrAmount(payableAmount)}</span>
                </div>
              )}
            </section>

            <section className="payment-section">
              <div className="section-heading">
                <h2>Student Details</h2>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="custom-label">
                    {identifierLabel} <span className="required">*</span>
                  </label>
                  <Input
                    {...register("identifier")}
                    className={`custom-input-pay ${errors.identifier ? "input-error" : ""}`}
                    placeholder={`Enter ${identifierLabel}`}
                    autoComplete="off"
                  />
                  {errors.identifier && (
                    <span className="field-error">{identifierLabel} is required</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="custom-label">
                    Student Name <span className="required">*</span>
                  </label>
                  <Input
                    {...register("studentName")}
                    className="custom-input-pay readonly-input"
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label className="custom-label">
                    Class <span className="required">*</span>
                  </label>
                  <Input
                    {...register("className")}
                    className="custom-input-pay readonly-input"
                    readOnly
                  />
                </div>

                {!isRegistrationLookup && (
                  <div className="form-group">
                    <label className="custom-label">Semester</label>
                    <Input
                      {...register("semester")}
                      className="custom-input-pay readonly-input"
                      readOnly
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="custom-label">Program</label>
                  <Input
                    {...register("program")}
                    className="custom-input-pay readonly-input"
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label className="custom-label">Department</label>
                  <Input
                    {...register("department")}
                    className="custom-input-pay readonly-input"
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label className="custom-label">Mobile Number</label>
                  <Input
                    {...register("mobileNumber")}
                    className="custom-input-pay readonly-input"
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label className="custom-label">
                    Email ID <span className="required">*</span>
                  </label>
                  <Input
                    {...register("emailId")}
                    className="custom-input-pay readonly-input"
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label className="custom-label">
                    Academic Year <span className="required">*</span>
                  </label>
                  <Input
                    {...register("academicYear")}
                    className="custom-input-pay readonly-input"
                    readOnly
                  />
                </div>
              </div>
            </section>

            <div className="checkbox-container">
              <input
                id="student-payment-agreement"
                type="checkbox"
                className="custom-checkbox"
                {...register("agreed")}
              />
              <label htmlFor="student-payment-agreement">
                I hereby confirm that I am paying the prescribed fee as per the institution&apos;s
                guidelines. I understand that this payment is subject to the rules and regulations
                of the institution. I acknowledge that the fee once paid is non-refundable unless
                otherwise stated in the official payment policy. I also agree to comply with all
                academic and administrative requirements after successful payment.
              </label>
            </div>
            {errors.agreed && <span className="field-error">{errors.agreed.message}</span>}

            <div className="proceed-btn-container">
              <Button type="submit" className="proceed-btn" disabled={submitting}>
                {submitting ? "Processing..." : "Proceed to Pay"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function StudentPaymentPage() {
  return (
    <Suspense fallback={<Loader />}>
      <StudentPaymentContent />
    </Suspense>
  );
}

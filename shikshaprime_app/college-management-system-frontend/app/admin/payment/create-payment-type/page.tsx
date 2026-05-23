"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useRoleGuard from "@/src/hooks/useRoleGuard";
import { useNotify } from "@/src/context/notificationContext";
import { useApi } from "@/src/hooks/useApi";
import {
  getAllPaymentTypes,
  createPaymentType,
  updatePaymentType,
  deletePaymentType,
} from "@/src/services/paymentService";
import { PaymentType } from "@/src/types/paymentTypes";
import {
  ArrowLeft,
  Plus,
  List,
  Save,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronLeft,
} from "lucide-react";
import "./create-payment-type.css";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreatePaymentTypePage() {
  const user = useRoleGuard("admin");
  const router = useRouter();
  const notify = useNotify();

  // API hooks
  const getPaymentTypesApi = useApi(getAllPaymentTypes);
  const createPaymentTypeApi = useApi(createPaymentType);
  const updatePaymentTypeApi = useApi(updatePaymentType);
  const deletePaymentTypeApi = useApi(deletePaymentType);

  // State
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    is_active: true,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch payment types on mount
  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  const fetchPaymentTypes = async () => {
    setIsLoading(true);
    try {
      const result = await getPaymentTypesApi.call();
      if (result.status === 1) {
        setPaymentTypes(result.data);
      } else {
        notify.error("Error", result.message || "Failed to fetch payment types");
      }
    } catch (err) {
      console.error("Error fetching payment types:", err);
      notify.error("Error", "Failed to fetch payment types");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      notify.warning("Validation Error", "Payment type name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        // Update existing
        const result = await updatePaymentTypeApi.call(editingId, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          amount: formData.amount !== "" ? parseFloat(formData.amount) : null,
          is_active: formData.is_active,
        });

        if (result.status === 1) {
          notify.success("Success", "Payment type updated successfully");
          resetForm();
          fetchPaymentTypes();
        } else {
          notify.error("Error", result.message || "Failed to update payment type");
        }
      } else {
        // Create new
        const result = await createPaymentTypeApi.call({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          amount: formData.amount !== "" ? parseFloat(formData.amount) : null,
          is_active: formData.is_active,
        });

        if (result.status === 1) {
          notify.success("Success", "Payment type created successfully");
          resetForm();
          fetchPaymentTypes();
        } else {
          notify.error("Error", result.message || "Failed to create payment type");
        }
      }
    } catch (err) {
      console.error("Error saving payment type:", err);
      notify.error("Error", "Failed to save payment type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (paymentType: PaymentType) => {
    setEditingId(paymentType.id);
    setFormData({
      name: paymentType.name,
      description: paymentType.description || "",
      amount: paymentType.amount != null ? String(paymentType.amount) : "",
      is_active: paymentType.is_active,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this payment type?")) {
      return;
    }

    try {
      const result = await deletePaymentTypeApi.call(id);
      if (result.status === 1) {
        notify.success("Success", "Payment type deleted successfully");
        fetchPaymentTypes();
      } else {
        notify.error("Error", result.message || "Failed to delete payment type");
      }
    } catch (err) {
      console.error("Error deleting payment type:", err);
      notify.error("Error", "Failed to delete payment type");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", amount: "", is_active: true });
    setEditingId(null);
  };

  const cancelEdit = () => {
    resetForm();
  };

  if (!user) return null;

  return (
    <div className="create-payment-type-container">
      <div className="page-header-row">
        <div className="flex items-center mb-3">
          <Link href={'/admin/payment'} className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center"><ChevronLeft className="h-5 w-5" /></Link>
        </div>
        {/* <button className="back-button" onClick={() => router.push("")}>
          <ArrowLeft size={18} />
        </button> */}
        <div className="page-header-text">
          <h3 className="text-md text-dark font-bold">Payment Type Management</h3>
          <p className="page-subtitle">Create and manage different types of payments</p>
        </div>
      </div>

      {/* Main Content Grid */}
      {isLoading ? (<Loader />) : (
        <div className="payment-type-grid">
          {/* Left: Add New Payment Type Form */}
          <div className="card-white">
            <div className="card-header">
              <Plus size={20} />
              <span>{editingId ? "Edit Payment Type" : "Add New Payment Type"}</span>
            </div>

            <form onSubmit={handleSubmit} className="payment-type-form">
              <div className="form-group">
                <Label htmlFor="name">
                  Payment Type Name <span className="required">*</span>
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Tuition Fee, Exam Fee"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <Label htmlFor="amount">
                  Amount
                </Label>
                <Input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="e.g., 5000"
                  className="form-input"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="description">
                  Description
                </Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional description"
                  className="form-textarea"
                  rows={3}
                />
              </div>

              

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <Input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="form-checkbox"
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="form-actions">
                <Button
                  type="submit"
                  // className="btn-primary"
                  disabled={isSubmitting}
                  variant="primary"
                >
                  <Save size={16} />
                  <span>{isSubmitting ? "Saving..." : "Save"}</span>
                </Button>
                {editingId && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={cancelEdit}
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right: Payment Types List */}
          <div className="card-white">
            <div className="card-header">
              <List size={20} />
              <span>Payment Types List</span>
            </div>

            <div className="payment-types-list">
              {getPaymentTypesApi.loading ? (
                <div className="empty-state">Loading payment types...</div>
              ) : paymentTypes.length === 0 ? (
                <div className="empty-state info">
                  No payment types found. Create one to get started.
                </div>
              ) : (
                <div className="types-table-wrapper">
                  <table className="types-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentTypes.map((type) => (
                        <tr key={type.id}>
                          <td className="type-name">{type.name}</td>
                          <td className="type-description">
                            {type.description || "-"}
                          </td>
                          <td>
                            {type.amount != null ? `₹${Number(type.amount).toLocaleString('en-IN')}` : "-"}
                          </td>
                          <td>
                            <span
                              className={`status-badge ${type.is_active ? "active" : "inactive"
                                }`}
                            >
                              {type.is_active ? (
                                <>
                                  <Check size={12} /> Active
                                </>
                              ) : (
                                <>
                                  <X size={12} /> Inactive
                                </>
                              )}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-icon edit"
                                onClick={() => handleEdit(type)}
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                className="btn-icon delete"
                                onClick={() => handleDelete(type.id)}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>)}
    </div>
  );
}

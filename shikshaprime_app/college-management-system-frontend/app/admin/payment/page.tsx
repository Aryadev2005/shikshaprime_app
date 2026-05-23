"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import useRoleGuard from "@/src/hooks/useRoleGuard";
import { UserPlus, BarChart3, CreditCard } from "lucide-react";
import "./payment.css";

export default function PaymentManagement() {
  const user = useRoleGuard("admin");
  const router = useRouter();

  if (!user) return null;

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  const menuCards = [
    {
      id: "create-payment-type",
      title: "Create Payment Type",
      description: "Add and manage different types of payments (Tuition Fee, Exam Fee, etc.)",
      icon: `${basePath}/images/icons/create-payment.gif`,
      color: "teal",
      path: "/admin/payment/create-payment-type",
    },
    {
      id: "assign-payment-type",
      title: "Assign Payment Type",
      description: "Assign payment types to students by class or individually",
      icon: `${basePath}/images/icons/payment-type.gif`,
      color: "magenta",
      path: "/admin/payment/assign-payment-type",
    },
    {
      id: "payment-dashboard",
      title: "Payment Dashboard",
      description: "View payment statistics, filter by class or defaulters, and export reports",
      icon: `${basePath}/images/icons/wallet-animation.gif`,
      color: "orange",
      path: "/admin/payment/dashboard",
    },
  ];

  return (
    <div className="payment-management-container">
      {/* Page Header */}
      <div className="payment-header flex items-center gap-3">
        {/* <div className="payment-icon-header bg-primary/10 p-2 rounded-lg">
          <Image
            src={`${basePath}/images/icons/payment-icon.svg`}
            alt="Payment Icon"
            width={32}
            height={32}
          />
        </div> */}
        <div>
          <h3 className="payment-title text-md text-dark font-bold">Payment Management</h3>
          <p className="payment-subtitle">
            Manage payment types, assign to students, and view payment dashboard
          </p>
        </div>
      </div>

      {/* Modern Menu Interface */}
      <div className="modern-payment-grid">
        {menuCards.map((card) => (
          <div
            key={card.id}
            className={`modern-payment-card ${card.color}`}
            onClick={() => router.push(card.path)}
          >
            <div className="card-shine"></div>
            <div className="modern-card-body">
              <div className="modern-icon-box">
                <Image
                  src={card.icon}
                  alt={card.title}
                  width={120}
                  height={120}
                  className="modern-image-icon"
                />
              </div>
              <div className="modern-card-info">
                <h3 className="modern-title-text">{card.title}</h3>
                <p className="modern-desc-text">{card.description}</p>
              </div>
            </div>
            <div className="card-hover-indicator"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

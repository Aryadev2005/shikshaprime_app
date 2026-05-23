"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import useRoleGuard from "@/src/hooks/useRoleGuard";
import "./fees.css";

export default function PaymentManagement() {
  const user = useRoleGuard("admin");
  const router = useRouter();

  if (!user) return null;

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  const menuCards = [
    {
      id: "fees-assignment",
      title: "Assign Fees to Students",
      description: "Assign Fees to Students",
      icon: `${basePath}/images/icons/create-payment.gif`,
      color: "teal",
      path: "/admin/fees/assignment",
    },
    {
      id: "collect-fees",
      title: "Collect Fees From Students",
      description: "Collect fees from students",
      icon: `${basePath}/images/icons/payment-type.gif`,
      color: "magenta",
      path: "/admin/fees/collection",
    },
    {
      id: "fees-reports",
      title: "Reports",
      description: "Daily Collection, Headwise Collection, Outstanding dues, Student ledger",
      icon: `${basePath}/images/icons/payment-dashboard.gif`,
      color: "orange",
      path: "/admin/fees/reports",
    }
  ];

  return (
    <div className="payment-management-container">
      {/* Page Header */}
      <div className="payment-header flex items-center gap-3">
        <div>
          <h3 className="payment-title text-md text-dark font-bold">Fees Management</h3>
          <p className="payment-subtitle">
            Manage fees, assign to students, and view reports
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
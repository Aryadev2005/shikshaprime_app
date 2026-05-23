"use client";
import React, { useEffect, useState } from "react";
import "./notices.css";
import { useRouter } from "next/navigation";
import { Eye, Trash2, Plus, Paperclip, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useApi } from "@/src/hooks/useApi";
import { getNotices, deleteNotice } from "@/src/services/noticesService";
import Link from "next/link";
import ConfirmModal from "@/src/components/global/ConfirmModal";
import { format } from "date-fns";
import { toast } from "sonner";
import { buildApiUrl } from "@/src/utils/tenantUrlBuilder";
import { useTenant } from "@/src/hooks/useTenant";

interface Notice {
  id: number;
  title: string;
  description: string;
  attachment: string | null;
  from_date: string;
  to_date: string;
}

export default function NoticesPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [noticeIdToDelete, setNoticeIdToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: noticeList, call: getNoticesList, loading } = useApi(getNotices);
  const { call: deleteNoticeApi } = useApi(deleteNotice);
  const tenant = useTenant();

  // Fetch notices with pagination
  useEffect(() => {
    getNoticesList({ page });
  }, [page]);

  const notices = noticeList?.data?.data || [];
  const pagination = noticeList?.data?.pagination;

  const handleDelete = (id: number) => {
    setNoticeIdToDelete(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noticeIdToDelete) return;

    setIsDeleting(true);

    try {
      const result = await deleteNoticeApi(noticeIdToDelete);

      if (result) {
        toast.success(result.message);
        getNoticesList({ page });
      }
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };  

  const getFileUrl = (path: string) => {
    if (!path) return "";
    return buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), path);
  };


  return (
    <>
      {loading && <Loader />}
      <div className="notices-panel-wrapper">
        {/* Header */}
        <div className="content-header">
          <h3 className="text-dark text-lg font-semibold">Notices</h3>

          <Button
            variant="primary"
            onClick={() =>
              router.push("/admin/notices/create?action=create")
            }
          >
            <Plus className="h-4 w-4" />
            Create Notice
          </Button>
        </div>

        {/* Table */}
        <div className="student-table-wrapper">
          <div style={{ overflowX: "auto" }}>
            <table className="custom-student-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Attachment</th>
                  <th>From Date</th>
                  <th>To Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {notices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="notices-empty-cell">No notices found.</td>
                  </tr>
                ) : (
                  notices.map((notice: Notice, idx: number) => (
                    <tr key={notice.id}>
                      <td>{(page - 1) * 10 + idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{notice.title}</td>
                      <td style={{ maxWidth: 260 }}>{notice.description.length > 80 ? notice.description.slice(0, 80) + "..." : notice.description}</td>
                      <td style={{ maxWidth: 300 }}>
                        {notice.attachment ? (
                          <a href={tenant ? getFileUrl(notice.attachment) : ''} target="_blank" className="notice-attachment-link">
                            <Paperclip className="h-3.5 w-3.5" />
                            {notice.attachment.split("/").pop()}
                          </a>
                        ) : ("—")}
                      </td>
                      <td>{notice.from_date ? format(new Date(notice.from_date), "dd-MMM-yyyy") : "--"}</td>
                      <td>{notice.to_date ? format(new Date(notice.to_date), "dd-MMM-yyyy") : "--"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center", }}>
                          <Link className="notice-action-btn" href={`/admin/notices/${notice.id}?action=view`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button className="notice-action-btn delete" onClick={() => handleDelete(notice.id)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
        {/* Pagination */}
        {pagination && (
          <div className="pagination-wrapper">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="page-nav-btn"><ChevronLeft className="h-4 w-4" /></button>
            {Array.from(
              { length: pagination.totalPages },
              (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`page-num-btn ${page === i + 1 ? "active" : ""
                    }`}
                >
                  {i + 1}
                </button>
              )
            )}
            <button disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)} className="page-nav-btn"><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        message="Are you sure you want to delete this notice?"
      />
    </>
  );
}
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import "./student-selection.css";
import { format } from "date-fns";
import { useAppSelector } from "@/src/store/hooks";
interface StudentModalProps {
  data: any;
  onClose: () => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ data, onClose }) => {
  if (!data) return null;
  const { programs } = useAppSelector((state) => state.programs);
  const { classes } = useAppSelector((state) => state.classes);

  const DetailItem = ({ label, value, type }: { label: string; value: any; type?: any }) => (
    <div className="flex flex-col gap-1 py-0 pl-3 border-r-1">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-medium text-gray-900 ${
          type === "capitalize"
            ? "capitalize"
            : type === "lowercase"
            ? "lowercase"
            : type === "uppercase"
            ? "uppercase"
            : ""
        }`}>{value || "N/A"}</span>
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="bg-[var(--primary-foreground)] rounder-md">
      <h3 className="text-md font-bold text-primary mb-2 py-2 px-3 uppercase tracking-tight rounded-2xl">
        {title}
      </h3>
    </div>
  );
  const getFileUrl = (path: string) => {
    if (!path) return "";
    return path.replace("http:", "https:").replace(
      "https://localhost/api", "http://localhost:8080/api"
    );
  };
  // const getFileUrl = (path: string) => {
  //   if (!path) return "";
  //   return `${process.env.NEXT_PUBLIC_FILE_PATH}${path}`;
  // };

  return (
    <>
      <Dialog open={!!data} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-screen h-screen max-h-[90vh] flex flex-col p-0 overflow-hidden dialog-container">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <div className="flex">
                <img src={getFileUrl(data?.documents?.profile_img)} className="rounded-full me-3" alt="" width={'50px'} height={'50px'} />
                <div>
                  <DialogTitle className="text-2xl font-bold">{data.first_name} {data.last_name}</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Registration ID: <span className="font-mono font-medium">{data.registration_id}</span>
                  </DialogDescription>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${data.status === 'REGISTRATION_COMPLETED' ? 'bg-green-100 text-green-700' :
                data.status === 'PAYMENT_PENDING' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                {data.status?.replace('_', ' ')}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-0 py-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-0">
              {/* Personal Info */}
              <div className="md:col-span-3 px-5 py-3 pt-0">
                <SectionTitle title="Personal Details" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DetailItem label="Gender" value={data?.gender} type={'capitalize'} />
                  <DetailItem label="Date of Birth" value={format(data?.date_of_birth, "dd-MMM-yyyy").toUpperCase()} type={'capitalize'} />
                  <DetailItem label="Mobile" value={data?.mobile} type={'capitalize'} />
                  <DetailItem label="Email" value={data?.email} type={'lowercase'} />
                  <DetailItem label="Nationality" value={data?.nationality} type={'capitalize'} />
                  <DetailItem label="Caste" value={data?.caste.toUpperCase()} type={'capitalize'} />
                  <DetailItem label="Religion" value={data?.religion} type={'capitalize'} />
                  <DetailItem label="Program" value={data?.program_id && programs?.find((item) => item?.id === data?.program_id)?.code} type={'capitalize'} />
                  <DetailItem label="Year" value={data?.class_id && classes?.find((item) => item?.id === data?.class_id)?.name} type={'capitalize'} />
                  <DetailItem label="Id proof type" value={data?.id_proof_type ? data?.id_proof_type.replace(/-/g, " ").toLowerCase().split(" ").map((w:any) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "-"} type={'capitalize'} />
                  <DetailItem label="Id proof number" value={data?.id_proof_number} type={'capitalize'} />
                  {data?.physically_challenged_certificate && <DetailItem label="Physically Challenged" value={'Physically Challenged'} type={'capitalize'} />}
                  
                </div>
              </div>

              {/* Family Info */}
              <div className="md:col-span-3 px-5 py-3 pt-0">
                <SectionTitle title="Family Information" />
                <div className="grid grid-cols-5 gap-4">
                  <DetailItem label="Father's Name" value={data?.father_name} type={'capitalize'} />
                  <DetailItem label="Mother's Name" value={data?.mother_name} type={'capitalize'} />
                  <DetailItem label="Guardian's Name" value={data?.guardian_name} type={'capitalize'} />
                  <DetailItem label="Mobile no:" value={data?.guardian_mobile} type={'capitalize'} />
                  <DetailItem label="Email id:" value={data?.guardian_email} type={'capitalize'} />
                </div>
              </div>

              {/* Address Info */}
              <div className="md:col-span-3 px-5 py-3 pt-0">
                <SectionTitle title="Address Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <DetailItem label="Address" value={data?.address_line} type={'capitalize'} />
                  <DetailItem label="City" value={data?.city} type={'capitalize'} />
                  <DetailItem label="State" value={data?.state} type={'capitalize'} />
                  <DetailItem label="Pin Code" value={data?.pin_code} type={'capitalize'} />
                </div>
              </div>
              {/* Status & Academic Info */}
              <div className="md:col-span-3 px-5 py-3 pt-0">
                <SectionTitle title="Academic Information" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DetailItem label="Program" value={data?.program_name} type={'capitalize'} />
                  <DetailItem label="Class" value={data?.class_name} type={'capitalize'} />
                  <DetailItem label="Department" value={data?.department_name} type={'capitalize'} />
                  <DetailItem label="Academic Year" value={data?.academic_year} type={'capitalize'} />
                  <DetailItem label="Mode" value={data?.mode} type={'capitalize'} />
                  <div className="flex flex-col gap-1 py-2 bg-orange-50/50 px-2 rounded">
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Attendance %</span>
                    <span className="text-sm font-bold text-orange-700">{data.attendance_percentage ? `${data.attendance_percentage}%` : "0%"}</span>
                  </div>
                  <DetailItem label="Present Days" value={data.present_count || 0} type={'capitalize'} />
                  <DetailItem label="Absent Days" value={data.absent_count || 0} type={'capitalize'} />
                </div>
              </div>
              <div className="md:col-span-3 px-5 py-3 pt-0">
                <SectionTitle title="10th Class" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <DetailItem label="Percentage" value={`${data.ten_percentage?.split('.')[0]} %` || 'NA'} type={'capitalize'} />
                  <DetailItem label="University" value={data.board_university_10th || 'NA'} type={'capitalize'} />
                  <DetailItem label="Year of passing" value={data.year_of_passing_10th || 'NA'} type={'capitalize'} />
                </div>
              </div>
              <div className="md:col-span-3 px-5 py-3 pt-0">
                <SectionTitle title="12th Class" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <DetailItem label="Percentage" value={`${data.twelve_percentage?.split('.')[0]} %` || 'NA'} type={'capitalize'} />
                  <DetailItem label="University" value={data.board_university_12th || 'NA'} type={'capitalize'} />
                  <DetailItem label="Year of passing" value={data.year_of_passing_12th || 'NA'} type={'capitalize'} />
                </div>
              </div>
              {data?.board_university_graduation && (
                <div className="md:col-span-3 px-5 py-3 pt-0">
                  <SectionTitle title="Graduation" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <DetailItem label="Percentage" value={`${data.graduation_percentage.split('.')[0]} %` || 'NA'} type={'capitalize'} />
                    <DetailItem label="University" value={data.board_university_graduation || 'NA'} type={'capitalize'} />
                    <DetailItem label="Year of passing" value={data.year_of_passing_graduation || 'NA'} type={'capitalize'} />
                  </div>
                </div>
              )

              }
              <div className="md:col-span-3 px-5 py-3 pt-0">
                <SectionTitle title="Documents" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: "Birth Certificate", url: data.documents?.birth_certificate },
                    { title: "Aadhar Card", url: data.documents?.aadhar },
                    { title: "10th Marksheet", url: data.documents?.ten_marksheet },
                    { title: "12th Marksheet", url: data.documents?.twelve_marksheet },
                    { title: "Graduation", url: data.documents?.graduation_doc },
                    { title: "Caste Certificate", url: data.documents?.caste_certificate_doc },
                    { title: "Physically Challenged", url: data.documents?.physically_challenged_certificate },
                  ].map((doc, index) => {
                    if (!doc.url) return null;
                    const fullUrl = getFileUrl(doc.url);
                    return (
                      <div key={index} className="flex flex-col border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white h-full">
                        <div className="bg-gray-50 border-b px-3 py-2">
                          <h4 className="font-semibold text-xs text-gray-700 uppercase tracking-wide truncate" title={doc.title}>
                            {doc.title}
                          </h4>
                        </div>
                        <div className="p-3 flex-1 flex flex-col items-center justify-center bg-gray-50/30">
                          <iframe
                            src={fullUrl}
                            className="w-full h-32 border rounded bg-white shadow-sm"
                            title={doc.title}
                          />
                        </div>
                        <div className="p-2 border-t bg-gray-50 flex justify-center">
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                          >
                            View Full Document
                          </a>
                        </div>
                      </div>
                    );
                  })}

                  {!data.documents?.aadhar && !data.documents?.birth_certificate && !data.documents?.ten_marksheet && !data.documents?.twelve_marksheet && (
                    <div className="col-span-full py-4 text-center text-gray-500 text-sm italic border-2 border-dashed rounded-lg bg-gray-50">
                      No documents uploaded for this student.
                    </div>
                  )}
                </div>
              </div>
              {/* Meta Info */}
              {/* <div className="md:col-span-3 mt-4 pt-4 border-t text-xs text-muted-foreground flex justify-between">
                <span>Created At: {new Date(data.created_at).toLocaleString()}</span>
                <span>Updated At: {new Date(data.updated_at).toLocaleString()}</span>
              </div> */}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudentModal;
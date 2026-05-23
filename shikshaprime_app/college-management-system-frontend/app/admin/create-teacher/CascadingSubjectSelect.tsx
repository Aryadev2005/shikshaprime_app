
import React, { useEffect, useState } from 'react';
import { fetchMasterDepartments, fetchChildDepartments, fetchSubjects } from '@/src/services/departmentService';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
interface Props {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
    required?: boolean;
}

export default function CascadingSubjectSelect({ value, onChange, className, required }: Props) {
    const [masters, setMasters] = useState<any[]>([]);
    const [children, setChildren] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const [selectedMaster, setSelectedMaster] = useState<string>("");
    const [selectedChild, setSelectedChild] = useState<string>("");

    // Load Masters on mount
    useEffect(() => {
        fetchMasterDepartments().then((data) => {
            if (data.status === 1) {
                setMasters(data.data || []);
            }
        }).catch(console.error);
    }, []);

    // Load Children when Master changes
    useEffect(() => {
        if (selectedMaster) {
            fetchChildDepartments(Number(selectedMaster)).then((data) => {
                if (data.status === 1) {
                    setChildren(data.data || []);
                }
            }).catch(console.error);
        }
    }, [selectedMaster]);

    // Load Subjects when Child changes
    useEffect(() => {
        if (selectedChild) {
            fetchSubjects(Number(selectedChild)).then((data) => {
                if (data.status === 1) {
                    setSubjects(data.data || []);
                }
            }).catch(console.error);
        }
    }, [selectedChild]);

    return (
        <div className="grid gap-2 grid-cols-3">
            <div className="form-group">
                <Label className="">Master Department</Label>
                <select
                    className={`form-select ${className}`}
                    value={selectedMaster}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSelectedMaster(val);
                        setChildren([]); // Clear children immediately
                        setSubjects([]); // Clear subjects immediately
                        setSelectedChild("");
                        onChange("");
                    }}
                >
                    <option value="">Select Master Dept</option>
                    {masters.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <Label className="">Child Department</Label>
                <select
                    className={`form-select ${className}`}
                    value={selectedChild}
                    onChange={(e) => {
                        setSelectedChild(e.target.value);
                        onChange("");
                    }}
                    disabled={!selectedMaster}
                >
                    <option value="">Select Child Dept</option>
                    {children.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <Label className="">Subject</Label>
                <select
                    className={`form-select ${className}`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={!selectedChild}
                    required={required}
                >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

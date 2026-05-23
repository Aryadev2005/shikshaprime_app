"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/src/hooks/useApi";

import {
  getAllTemplates,
  getExamComponents,
  addComponentToExam,
  reorderComponents,
  createComponentTemplate,
} from "@/src/services/examinationService";

import { Loader } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-label";

import "./exam-component-editor.css";

interface Exam {
  id: string;
  exam_name: string;
  exam_type: string;
}

interface ExamComponentEditorProps {
  exams: Exam[];
  loadingExams: boolean;
}

export default function ExamComponentEditor({
  exams,
  loadingExams,
}: ExamComponentEditorProps) {
  const [selectedExam, setSelectedExam] = useState("");
  const [examComponents, setExamComponents] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    componentName: "",
    componentType: "THEORY",
    defaultWeightage: "",
    defaultDuration: "",
    isActive: true,
  });

  const [mappingForm, setMappingForm] = useState({
    maxMarks: "",
    minMarks: "",
    weightage: "100",
    durationMinutes: "",
    passRequired: false,
  });

  const { data: templates, call: loadTemplates } = useApi(getAllTemplates);
  const { data: examComponentData, call: loadExamComponents } =
    useApi(getExamComponents);

  const { call: apiAddComponent } = useApi(addComponentToExam);
  const { call: apiReorder } = useApi(reorderComponents);
  const { call: apiCreateTemplate } = useApi(createComponentTemplate);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedExam) loadExamComponents(selectedExam);
  }, [selectedExam]);

  useEffect(() => {
    if (templates?.data) setAllTemplates(templates.data);
    if (examComponentData?.data) setExamComponents(examComponentData.data);
  }, [templates, examComponentData]);

  // -----------------------------
  // DRAG & DROP
  // -----------------------------
  const onDragStart = (e, item) => {
    e.dataTransfer.setData("item", JSON.stringify(item));
  };

  const allowDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const onDrop = async (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    const item = JSON.parse(e.dataTransfer.getData("item"));

    // Dropping a template → open mapping form
    if (item.type === "template") {
      // Prevent adding same template twice
      const alreadyExists = examComponents.some(
        (c) => c.componentTemplateId === item.data.id
      );

      if (alreadyExists) {
        alert("This template is already added to the exam");
        return;
      }
      setSelectedTemplate(item.data);
      return;
    }

    // Dropping a mapped component → reorder
    const newOrder = [...examComponents];
    const draggedIndex = newOrder.findIndex(
      (c) => c.mappingId === item.data.mappingId
    );

    const dropIndex = Number(e.currentTarget.dataset.index);

    const moved = newOrder.splice(draggedIndex, 1)[0];
    newOrder.splice(dropIndex, 0, moved);

    setExamComponents(newOrder);

    await apiReorder(
      selectedExam,
      newOrder.map((c) => c.componentTemplateId)
    );
  };

  // -----------------------------
  // ADD TEMPLATE TO EXAM
  // -----------------------------
  const handleAddMapping = async () => {
    if (!selectedTemplate) return;

    // Prevent duplicate
    if (examComponents.some(c => c.componentTemplateId === selectedTemplate.id)) {
      alert("This template is already added to the exam");
      return;
    }
    const payload = {
      componentTemplateId: selectedTemplate.id,
      maxMarks: Number(mappingForm.maxMarks),
      minMarks: Number(mappingForm.minMarks),
      weightage: Number(mappingForm.weightage),
      durationMinutes: Number(mappingForm.durationMinutes) || null,
      passRequired: mappingForm.passRequired,
    };

    await apiAddComponent(selectedExam, payload);
    await loadExamComponents(selectedExam);

    setSelectedTemplate(null);
    setMappingForm({
      maxMarks: "",
      minMarks: "",
      weightage: "100",
      durationMinutes: "",
      passRequired: false,
    });
  };

  // -----------------------------
  // CREATE TEMPLATE
  // -----------------------------
  const handleSaveTemplate = async () => {
    await apiCreateTemplate({
      componentName: newTemplate.componentName,
      componentType: newTemplate.componentType,
      defaultWeightage: Number(newTemplate.defaultWeightage) || null,
      defaultDuration: Number(newTemplate.defaultDuration) || null,
      isActive: newTemplate.isActive,
    });

    await loadTemplates();
    setShowCreateForm(false);

    setNewTemplate({
      componentName: "",
      componentType: "THEORY",
      defaultWeightage: "",
      defaultDuration: "",
      isActive: true,
    });
  };

  return (
    <div className="exam-editor-page">
      <h2 className="text-xl font-semibold mb-4">Exam Component Editor</h2>

      {/* Exam Dropdown */}
      <div className="editor-field mb-4">
        <Label>Select Exam</Label>
        <select
          className="editor-select"
          value={selectedExam}
          disabled={loadingExams}
          onChange={(e) => setSelectedExam(e.target.value)}
        >
          <option value="">-- Choose an exam --</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.exam_name} ({exam.exam_type})
            </option>
          ))}
        </select>
      </div>

      {/* All Templates */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">All Templates</h3>
        <Button variant="primary" onClick={() => setShowCreateForm(true)}>
          + Create Template
        </Button>
      </div>

      {/* Inline Create Template Form */}
      {showCreateForm && (
        <div className="mapping-form mt-4">
          <h3 className="font-semibold mb-3">Create New Template</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Template Name</Label>
              <Input
                className="mt-1"
                value={newTemplate.componentName}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    componentName: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Template Type</Label>
              <select
                className="editor-select mt-1"
                value={newTemplate.componentType}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    componentType: e.target.value,
                  })
                }
              >
                <option value="THEORY">Theory</option>
                <option value="PRACTICAL">Practical</option>
                <option value="PROJECT">Project</option>
                <option value="VIVA">Viva</option>
              </select>
            </div>

            <div>
              <Label>Default Weightage (%)</Label>
              <Input
                className="mt-1"
                type="number"
                value={newTemplate.defaultWeightage}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    defaultWeightage: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Default Duration (minutes)</Label>
              <Input
                className="mt-1"
                type="number"
                value={newTemplate.defaultDuration}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    defaultDuration: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-span-2 flex items-center gap-3 mt-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={newTemplate.isActive}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    isActive: e.target.checked,
                  })
                }
              />
              <Label className="text-sm font-medium">Active</Label>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="primary" onClick={handleSaveTemplate}>
              Save Template
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Template Grid */}
      <div className="template-grid">
        {allTemplates.map((t) => (
          <div
            key={t.id}
            className="template-card"
            draggable={!examComponents.some(c => c.componentTemplateId === t.id)}
            onDragStart={(e) => onDragStart(e, { type: "template", data: t })}
          >
            <div className="font-semibold">{t.componentName}</div>
            <div className="text-sm text-gray-500">{t.componentType}</div>

            {examComponents.some(c => c.componentTemplateId === t.id) && (
              <span className="template-added-badge">Added</span>
            )}
          </div>
        ))}
      </div>

      {/* Mapping Form */}
      {selectedTemplate && (
        <div className="mapping-form">
          <h3 className="font-semibold mb-2">
            Map Template: {selectedTemplate.componentName}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Max Marks</Label>
              <Input
                value={mappingForm.maxMarks}
                onChange={(e) =>
                  setMappingForm({ ...mappingForm, maxMarks: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Min Marks</Label>
              <Input
                value={mappingForm.minMarks}
                onChange={(e) =>
                  setMappingForm({ ...mappingForm, minMarks: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Weightage (%)</Label>
              <Input
                value={mappingForm.weightage}
                onChange={(e) =>
                  setMappingForm({ ...mappingForm, weightage: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Duration (minutes)</Label>
              <Input
                value={mappingForm.durationMinutes}
                onChange={(e) =>
                  setMappingForm({
                    ...mappingForm,
                    durationMinutes: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                checked={mappingForm.passRequired}
                onChange={(e) =>
                  setMappingForm({
                    ...mappingForm,
                    passRequired: e.target.checked,
                  })
                }
              />
              <Label>Mandatory to Pass</Label>
            </div>
          </div>

          <Button variant="primary" className="mt-3" onClick={handleAddMapping}>
            Add to Exam
          </Button>
        </div>
      )}

      {/* Exam Components */}
      {selectedExam && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Exam Components</h3>

          <div
            className="exam-component-list"
            onDragOver={allowDrop}
            onDrop={onDrop}
            data-index={examComponents.length}
          >
            {examComponents.length === 0 && (
              <div className="drop-placeholder">
                Drop templates here
              </div>
            )}

            {examComponents.map((c, index) => (
              <div
                key={c.mappingId}
                className="exam-component-card"
                draggable
                data-index={index}
                onDragStart={(e) =>
                  onDragStart(e, { type: "mapping", data: c })
                }
              >
                <div className="font-semibold">
                  {c.template.name} ({c.template.type})
                </div>
                <div className="text-sm text-gray-500">
                  Max: {c.maxMarks} | Min: {c.minMarks} | Weightage:{" "}
                  {c.weightage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
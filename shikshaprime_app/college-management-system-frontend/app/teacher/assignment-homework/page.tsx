"use client";
import React, { useState, useEffect, useContext } from 'react';
import './assignment-homework.css';
import { Plus, List, FileText, BookOpen, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthContext } from '@/src/context/authContext';
import { Eye } from 'lucide-react';
import CreateAssignment from './CreateAssignment';
import { AssignmentAPI } from '@/src/services/assignmentService';
import { useRouter } from 'next/navigation';
import { Loader } from '@/components/ui/loader';

interface AssignmentHomework {
  id: number;
  title: string;
  description: string;
  type: 'Assignment' | 'Homework';
  subject: string;
  classSection: string;
  dueDateTime: string;
  submissions: number;
}

export default function AssignmentHomeworkPage() {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentHomework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, isInitialized } = useContext(AuthContext)!;

  // Fetch assignments on component mount - only when authenticated
  useEffect(() => {
    if (isInitialized && user) {
      fetchAssignments();
    }
  }, [isInitialized, user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await AssignmentAPI.getFacultyAssignments();
      
      if (response.status === 'success') {
        const transformedAssignments = response.data.assignments.map((assignment: any) => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          type: assignment.type,
          subject: assignment.subject_name || `Subject ${assignment.subject_id}`,
          classSection: `${assignment.program_name || 'Program'}${assignment.section_name ? ` - ${assignment.section_name}` : ''}`,
          dueDateTime: `${assignment.due_date} ${assignment.due_time}`,
          submissions: assignment.submissions || 0
        }));
        setAssignments(transformedAssignments);
      } else {
        setError('Failed to fetch assignments');
      }
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'Failed to connect to server.');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAssignments();
  };

  const handleViewAssignment = (id: number) => { 
    console.log("View assignment with ID:", id); 
    router.push(`/teacher/assignment-homework/${id}`);
  };

  const totalActive = assignments.length;
  const totalAssignments = assignments.filter(a => a.type === 'Assignment').length;
  const totalHomework = assignments.filter(a => a.type === 'Homework').length;
  const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissions, 0);

  if (showCreateForm) {
    return (
      <div className="assignment-homework-wrapper">
        <CreateAssignment 
          onBack={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchAssignments();
          }}
        />
      </div>
    );
  }

  return (
    <div className="assignment-homework-wrapper">
      <div className="content-header">
        <h3>Assignment & Homework Dashboard</h3>
        <div className="header-actions">
          {error && <div className="error-message">{error}</div>}
          {/* <Button 
            className="refresh-btn" 
            variant="secondary" 
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button> */}
          <Button 
            variant="primary" 
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="btn-icon" />Create New Assignment
          </Button>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-icon-wrapper stat-icon-blue">
            <List className="stat-icon" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{totalActive}</div>
            <div className="stat-label">Total Active</div>
          </div>
        </div>

        <div className="stat-card stat-card-cyan">
          <div className="stat-icon-wrapper stat-icon-cyan">
            <FileText className="stat-icon" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{totalAssignments}</div>
            <div className="stat-label">Assignments</div>
          </div>
        </div>

        <div className="stat-card stat-card-yellow">
          <div className="stat-icon-wrapper stat-icon-yellow">
            <BookOpen className="stat-icon" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{totalHomework}</div>
            <div className="stat-label">Homework</div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-icon-wrapper stat-icon-green">
            <CheckCircle className="stat-icon" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{totalSubmissions}</div>
            <div className="stat-label">Total Submissions</div>
          </div>
        </div>
      </div>

      <div className="assignments-section">
        <div className="section-header">
          {/* <List className="section-icon" /> */}
          <h3 className="section-title">All Assignments & Homework</h3>
        </div>

        <div className="table-wrapper">
          <table className="assignments-table custom-student-table">
            <thead>
              <tr>
                <th>Title & Description</th>
                <th>Type</th>
                <th>Subject</th>
                <th>Class/Section</th>
                <th>Due Date & Time</th>
                <th>Submissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="loading-state">
                    <div className="loading-content">
                      <Loader/>
                    </div>
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <div className="empty-state-content">
                      <FileText className="empty-icon" />
                      <p className="empty-text">No assignments or homework found</p>
                      <p className="empty-subtext">Create your first assignment to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                assignments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="title-cell">
                        <div className="title">{item.title}</div>
                        <div className="description">{item.description}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`type-badge ${item.type.toLowerCase()}`}>
                        {item.type}
                      </span>
                    </td>
                    <td>{item.subject}</td>
                    <td>{item.classSection}</td>
                    <td>{item.dueDateTime}</td>
                    <td>
                      <span className="submissions-count">{item.submissions}</span>
                    </td>
                    <td align="center"> 
                      <Button variant="outline" size="sm" onClick={() => handleViewAssignment(item.id)} > 
                        <Eye className="btn-icon" /></Button> 
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

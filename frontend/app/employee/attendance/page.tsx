'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, isBefore, isAfter, startOfToday, endOfDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useSearchParams } from 'next/navigation';

import {
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
  Edit3,
  Calendar as CalendarIcon
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// --- Setup Localizer ---
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
});

import { Card } from '@/components/ui/card';
import { API_ENDPOINTS, buildApiUrl, apiRequest } from '@/lib/api';

const Button = ({ onClick, variant = "primary", size = "default", children, className = "", disabled }) => {
  const base = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow",
    outline: "border-2 border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300",
    ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200",
    destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-200",
  };
  const sizes = {
    default: "h-11 py-2.5 px-5 text-sm",
    sm: "h-9 px-3.5 text-sm",
    icon: "h-10 w-10"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

const Select = ({ value, onChange, children, className = "", disabled }) => (
  <select
    value={value}
    onChange={onChange}
    disabled={disabled}
    className={`h-11 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </select>
);

// --- Modal Component ---
const AttendanceModal = ({ isOpen, onClose, date, currentStatus, onSave, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {date ? format(date, 'MMMM d, yyyy') : '...'}
            </h3>
            <p className="text-sm text-slate-500">
              {date ? format(date, 'EEEE') : '...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-8">
          {currentStatus ? (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Current Status</p>
              <p className={`text-lg font-semibold ${currentStatus === 'Present' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {currentStatus}
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-sm text-amber-800 font-medium">No attendance marked for this day</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700 mb-3">Mark Attendance</p>
          <Button
            variant="success"
            onClick={() => onSave('Present')}
            disabled={loading}
            className="w-full gap-2 justify-center text-base"
          >
            <CheckCircle2 className="w-5 h-5" /> Mark as Present
          </Button>

          <Button
            variant="destructive"
            onClick={() => onSave('Absent')}
            disabled={loading}
            className="w-full gap-2 justify-center text-base"
          >
            <XCircle className="w-5 h-5" /> Mark as Absent
          </Button>

          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full justify-center"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
function Attendance() {
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('employeeId');

  const [attendanceData, setAttendanceData] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current date info
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Date Navigation - initialize to current month
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Generate year options (current year ± 5 years, but filter out future years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).filter(year => year <= currentYear);
  }, []);

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Check if a month/year combination is in the future
  const isFutureMonth = (year, month) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    if (year > currentYear) return true;
    if (year === currentYear && month > currentMonth) return true;
    return false;
  };

  // Fetch Data with date filtering
  const fetchAllData = React.useCallback(async () => {
    try {
      setLoading(true);

      // Calculate date range for the selected month
      const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd');

      // Fetch attendance with filters
      const attendanceUrl = buildApiUrl(API_ENDPOINTS.attendances, {
        employee: employeeId!,
        date_after: startDate,
        date_before: endDate
      });
      const attRes = await apiRequest(attendanceUrl);
      const attData = await attRes.json();
      setAttendanceData(Array.isArray(attData) ? attData : attData.results || []);

      // Fetch employee data
      const employeeUrl = buildApiUrl(API_ENDPOINTS.employee(employeeId!));
      const empRes = await apiRequest(employeeUrl);
      const empData = await empRes.json();
      setEmployee(empData);

      // Fetch department if employee has department
      if (empData.department) {
        const departmentUrl = buildApiUrl(API_ENDPOINTS.department(empData.department));
        const deptRes = await apiRequest(departmentUrl);
        const deptData = await deptRes.json();
        setDepartment(deptData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [employeeId, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Update current date when year/month changes
  useEffect(() => {
    setCurrentDate(new Date(selectedYear, selectedMonth, 1));
  }, [selectedYear, selectedMonth]);

  // Stats Calculation
  const stats = useMemo(() => {
    const totalPresent = attendanceData.filter(r => r.status === 'Present').length;
    const totalAbsent = attendanceData.filter(r => r.status === 'Absent').length;
    const total = totalPresent + totalAbsent || 1;
    const percentage = Math.round((totalPresent / total) * 100);
    return { totalPresent, totalAbsent, total: attendanceData.length, percentage };
  }, [attendanceData]);

  // Handle Cell Click (Open Modal) - only for past and present dates (including today)
  const handleDateClick = (date) => {
    const todayEnd = endOfDay(new Date());
    if (isAfter(date, todayEnd)) {
      return; // Don't allow future dates
    }
    setSelectedDate(date);
    setModalOpen(true);
  };

  // Handle Save (Update/Create)
  const handleSaveAttendance = async (status) => {
    if (!selectedDate) return;
    setActionLoading(true);

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingRecord = attendanceData.find(a => a.date === dateStr);

    try {
      let response;
      if (existingRecord) {
        // UPDATE existing record
        const updateUrl = buildApiUrl(API_ENDPOINTS.attendance(existingRecord.id));
        response = await apiRequest(updateUrl, {
          method: 'PUT',
          body: JSON.stringify({
            date: dateStr,
            status,
            employee: employeeId
          }),
        });
      } else {
        // CREATE new record
        const createUrl = buildApiUrl(API_ENDPOINTS.attendances);
        response = await apiRequest(createUrl, {
          method: 'POST',
          body: JSON.stringify({
            date: dateStr,
            status,
            employee: employeeId
          }),
        });
      }

      if (response.ok) {
        await fetchAllData();
        setModalOpen(false);
      } else {
        const errorData = await response.json();
        console.error("Failed to update attendance:", errorData);
        alert("Failed to update attendance. Please try again.");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Calendar Configuration
  const events = attendanceData.map(record => ({
    id: record.id,
    start: new Date(record.date),
    end: new Date(record.date),
    title: record.status,
    status: record.status,
    allDay: true,
  }));

  const dayPropGetter = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = attendanceData.find(a => a.date === dateStr);
    const todayEnd = endOfDay(new Date());
    const isFuture = isAfter(date, todayEnd);

    // Base style for all cells
    let style = {
      transition: 'background-color 0.2s',
      position: 'relative',
    };
    let className = "";

    if (isFuture) {
      style.backgroundColor = 'rgba(148, 163, 184, 0.05)';
      style.cursor = 'not-allowed';
      style.opacity = '0.5';
    } else if (record) {
      style.cursor = 'pointer';
      className = "hover:bg-slate-50";
      if (record.status === 'Present') {
        style.backgroundColor = 'rgba(34, 197, 94, 0.15)'; // Greenish
        style.border = '1px solid rgba(34, 197, 94, 0.2)';
      }
      if (record.status === 'Absent') {
        style.backgroundColor = 'rgba(239, 68, 68, 0.15)'; // Reddish
        style.border = '1px solid rgba(239, 68, 68, 0.2)';
      }
    } else {
      // No record and not future - show cursor pointer for editable cells
      style.cursor = 'pointer';
      className = "hover:bg-slate-50 editable-cell";
    }

    return { style, className };
  };

  // Custom Event Component to show status indicators
  const CustomEvent = ({ event }) => {
    const todayEnd = endOfDay(new Date());
    const isFuture = isAfter(event.start, todayEnd);

    if (isFuture) return null;

    return (
      <div className="flex items-center justify-between px-2 py-1">
        {event.status === 'Present' ? (
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-semibold">P</span>
          </div>
        ) : event.status === 'Absent' ? (
          <div className="flex items-center gap-1.5 text-rose-700">
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-semibold">A</span>
          </div>
        ) : null}
      </div>
    );
  };

  const CustomToolbar = () => {
    // Check if next month would be in the future
    const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    const canGoNext = !isFutureMonth(nextYear, nextMonth);

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-slate-600" />
            <Select
              value={selectedMonth}
              onChange={(e) => {
                const newMonth = parseInt(e.target.value);
                // Only allow change if not going to future
                if (!isFutureMonth(selectedYear, newMonth)) {
                  setSelectedMonth(newMonth);
                }
              }}
              className="w-36"
            >
              {monthOptions.map((month, idx) => {
                const isDisabled = isFutureMonth(selectedYear, idx);
                return (
                  <option key={idx} value={idx} disabled={isDisabled} style={{ color: isDisabled ? '#ccc' : 'inherit' }}>
                    {month}
                  </option>
                );
              })}
            </Select>
          </div>

          <Select
            value={selectedYear}
            onChange={(e) => {
              const newYear = parseInt(e.target.value);
              // If the current selected month would be in future with new year, reset to current month
              if (isFutureMonth(newYear, selectedMonth)) {
                setSelectedMonth(currentMonth);
              }
              setSelectedYear(newYear);
            }}
            className="w-28"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              setSelectedYear(today.getFullYear());
              setSelectedMonth(today.getMonth());
            }}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
            disabled={!canGoNext}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading && !employee) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Employee Information Header */}
        <Card className="p-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none shadow-xl rounded-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">{employee?.full_name || 'Employee'}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <span className="font-mono font-semibold text-white">{employee?.emp_id || 'N/A'}</span>
                  </div>
                  {employee?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{employee.email}</span>
                    </div>
                  )}
                  {department?.name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{department.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{stats.totalPresent}</div>
                <div className="text-xs text-slate-300 mt-1">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-400">{stats.totalAbsent}</div>
                <div className="text-xs text-slate-300 mt-1">Absent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.percentage}%</div>
                <div className="text-xs text-slate-300 mt-1">Attendance Rate</div>
              </div>
            </div>
          </div>
        </Card>


        <div className="flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-slate-700">Present (P)</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span className="text-slate-700">Absent (A)</span>
          </div>
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-slate-400" />
            <span className="text-slate-700">Mark Attendance</span>
          </div>
        </div>

        {/* Calendar Section */}
        <Card className="p-8 shadow-lg bg-white rounded-2xl border border-slate-200/60">
          <style>{`
            .rbc-calendar {
              font-family: inherit;
            }
            .rbc-header {
              padding: 12px 8px;
              font-weight: 600;
              font-size: 0.875rem;
              color: #475569;
              border-bottom: 2px solid #e2e8f0;
              background: #f8fafc;
            }
            .rbc-month-view {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              overflow: hidden;
            }
            .rbc-day-bg {
              border-left: 1px solid #e2e8f0;
            }
            .rbc-date-cell {
              padding: 8px;
              text-align: right;
            }
            .rbc-now .rbc-date-cell {
              font-weight: 700;
            }
            .rbc-now .rbc-date-cell > a {
              background: #0f172a !important;
              color: white !important;
              border-radius: 8px;
              padding: 4px 8px;
              text-decoration: none;
            }
            .rbc-off-range-bg {
              background: #f8fafc;
            }
            .rbc-today {
              background-color: rgba(15, 23, 42, 0.05) !important;
              border: 2px solid rgba(15, 23, 42, 0.1) !important;
            }
            .rbc-event {
              background: transparent !important;
              border: none !important;
              padding: 0 !important;
            }
            .rbc-month-row {
              border-top: 1px solid #e2e8f0;
              min-height: 80px;
            }
            
            /* Edit icon for empty cells */
            .editable-cell::after {
              content: '';
              position: absolute;
              bottom: 8px;
              right: 8px;
              width: 16px;
              height: 16px;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 20h9'/%3E%3Cpath d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'/%3E%3C/svg%3E");
              background-size: contain;
              background-repeat: no-repeat;
              opacity: 0.4;
              transition: opacity 0.2s;
              pointer-events: none;
            }
            
            .editable-cell:hover::after {
              opacity: 0.8;
            }
          `}</style>

          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            date={currentDate}
            onNavigate={setCurrentDate}
            views={['month']}
            defaultView="month"

            // Interactivity
            selectable={true}
            onSelectSlot={(slotInfo) => handleDateClick(slotInfo.start)}
            onSelectEvent={(event) => handleDateClick(event.start)}

            // Styling
            components={{
              toolbar: CustomToolbar,
              event: CustomEvent
            }}
            dayPropGetter={dayPropGetter}
          />
        </Card>
      </div>

      {/* Action Modal */}
      <AttendanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        date={selectedDate}
        loading={actionLoading}
        onSave={handleSaveAttendance}
        currentStatus={
          selectedDate && attendanceData.find(a => a.date === format(selectedDate, 'yyyy-MM-dd'))?.status
        }
      />
    </div>
  );
}

export default Attendance;
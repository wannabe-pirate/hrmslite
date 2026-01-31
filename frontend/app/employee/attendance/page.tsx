'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, isBefore, isAfter, startOfToday } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
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

// --- UI Components ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm ${className}`}>{children}</div>
);

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

const Select = ({ value, onChange, children, className = "" }) => (
  <select 
    value={value} 
    onChange={onChange}
    className={`h-11 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:border-slate-400 ${className}`}
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
function AttendanceCalendar({ employeeId = 1 }) {
  const [attendanceData, setAttendanceData] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Date Navigation
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Generate year options (current year ± 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  }, []);

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch Data with date filtering
  const fetchAllData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range for the selected month
      const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd');
      
      // Fetch attendance with filters
      const attRes = await fetch(
        `http://localhost:8000/attendences/?employee=${employeeId}&date_after=${startDate}&date_before=${endDate}`
      );
      const attData = await attRes.json();
      setAttendanceData(Array.isArray(attData) ? attData : attData.results || []);

      // Fetch employee data
      const empRes = await fetch(`http://localhost:8000/employees/${employeeId}/`);
      const empData = await empRes.json();
      setEmployee(empData);
      
      // Fetch department if employee has department
      if (empData.department) {
        const deptRes = await fetch(`http://localhost:8000/departments/${empData.department}/`);
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

  // Handle Cell Click (Open Modal) - only for past and present dates
  const handleDateClick = (date) => {
    const today = startOfToday();
    if (isAfter(date, today)) {
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
        response = await fetch(`http://localhost:8000/attendences/${existingRecord.id}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            date: dateStr,
            status, 
            employee: employeeId
          }),
        });
      } else {
        // CREATE new record
        response = await fetch(`http://localhost:8000/attendences/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    const today = startOfToday();
    const isFuture = isAfter(date, today);
    
    let style = { 
      position: 'relative',
      transition: 'all 0.2s ease',
      minHeight: '80px',
    };
    
    let className = "";

    if (isFuture) {
      style.backgroundColor = 'rgba(148, 163, 184, 0.05)';
      style.cursor = 'not-allowed';
      style.opacity = '0.5';
    } else {
      style.cursor = 'pointer';
      className = "hover:bg-slate-50 hover:shadow-sm";
      
      if (record) {
        if (record.status === 'Present') {
          style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
          style.borderLeft = '3px solid rgb(16, 185, 129)';
        } else if (record.status === 'Absent') {
          style.backgroundColor = 'rgba(244, 63, 94, 0.08)';
          style.borderLeft = '3px solid rgb(244, 63, 94)';
        }
      } else {
        style.borderLeft = '3px solid rgb(203, 213, 225)';
      }
    }

    return { style, className };
  };

  // Custom Event Component to show status indicators
  const CustomEvent = ({ event }) => {
    const today = startOfToday();
    const isFuture = isAfter(event.start, today);
    
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

  // Custom Date Cell Wrapper to add edit icon for editable cells
  const CustomDateCellWrapper = ({ children, value }) => {
    const dateStr = format(value, 'yyyy-MM-dd');
    const record = attendanceData.find(a => a.date === dateStr);
    const today = startOfToday();
    const isFuture = isAfter(value, today);
    
    return (
      <div className="relative h-full">
        {children}
        {!isFuture && !record && (
          <div className="absolute bottom-2 right-2 text-slate-400">
            <Edit3 className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    );
  };

  const CustomToolbar = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-slate-600" />
          <Select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="w-36"
          >
            {monthOptions.map((month, idx) => (
              <option key={idx} value={idx}>{month}</option>
            ))}
          </Select>
        </div>
        
        <Select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
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
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

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
        <Card className="p-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{employee?.full_name || 'Employee'}</h1>
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
                <div className="text-3xl font-bold text-emerald-400">{stats.totalPresent}</div>
                <div className="text-xs text-slate-300 mt-1">Present</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-rose-400">{stats.totalAbsent}</div>
                <div className="text-xs text-slate-300 mt-1">Absent</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.percentage}%</div>
                <div className="text-xs text-slate-300 mt-1">Rate</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Attendance Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">Monthly Overview</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Attendance Rate</span>
                  <span className="text-2xl font-bold text-slate-900">{stats.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-slate-800 to-slate-600 h-full rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${stats.percentage}%` }} 
                  />
                </div>
              </div>
              <div className="flex justify-between pt-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-600">Present: <strong className="text-slate-900">{stats.totalPresent}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <span className="text-slate-600">Absent: <strong className="text-slate-900">{stats.totalAbsent}</strong></span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-slate-50 to-white">
            <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">Legend</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">Present (P)</span>
              </div>
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span className="text-slate-700">Absent (A)</span>
              </div>
              <div className="flex items-center gap-3">
                <Edit3 className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700">Editable</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar Section */}
        <Card className="p-8 shadow-lg">
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
              background: #0f172a;
              color: white;
              border-radius: 8px;
              padding: 4px 8px;
            }
            .rbc-off-range-bg {
              background: #f8fafc;
            }
            .rbc-today {
              background-color: rgba(15, 23, 42, 0.03);
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
              event: CustomEvent,
              dateCellWrapper: CustomDateCellWrapper
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

export default AttendanceCalendar;
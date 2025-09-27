import { useState, useEffect } from "react";

const Calendar = ({ tasks = [], currentDate, onDateChange, onTaskClick, loading = false }) => {
  const [internalDate, setInternalDate] = useState(currentDate || new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Debug log for tasks
  useEffect(() => {
    console.log('Calendar received tasks:', tasks.length, 'tasks');
    if (tasks.length > 0) {
      console.log('Sample task:', tasks[0]);
      console.log('All tasks:', tasks.map(t => ({ title: t.title, dueDate: t.dueDate, status: t.status })));
    }
  }, [tasks]);

  // Use currentDate prop or internal state
  const displayDate = currentDate || internalDate;

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1);
  const lastDayOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0);
  // Adjust for Monday-first week: 0=Sunday -> 6, 1=Monday -> 0, 2=Tuesday -> 1, etc.
  const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const daysInMonth = lastDayOfMonth.getDate();

  // Get days from previous month to fill the grid
  const prevMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 0);
  const daysFromPrevMonth = prevMonth.getDate();

  // Create calendar grid
  const calendarDays = [];
  
  // Add days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysFromPrevMonth - i;
    const prevMonthDate = new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, day);
    const today = new Date();
    calendarDays.push({
      date: prevMonthDate,
      isCurrentMonth: false,
      isToday: prevMonthDate.toDateString() === today.toDateString()
    });
  }

  // Add days from current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    const today = new Date();
    calendarDays.push({
      date,
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString()
    });
  }

  // Add days from next month to complete the grid
  const remainingDays = 42 - calendarDays.length; // 6 weeks * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const nextMonthDate = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, day);
    const today = new Date();
    calendarDays.push({
      date: nextMonthDate,
      isCurrentMonth: false,
      isToday: nextMonthDate.toDateString() === today.toDateString()
    });
  }

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    if (!date) return [];
    
    // Get date in YYYY-MM-DD format for comparison (avoid timezone issues)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    const filteredTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      
      // Handle both Date objects and string dates
      let taskDate;
      if (task.dueDate instanceof Date) {
        taskDate = task.dueDate;
      } else {
        taskDate = new Date(task.dueDate);
      }
      
      // Check if the date is valid
      if (isNaN(taskDate.getTime())) return false;
      
      // Use local date format to avoid timezone issues
      const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
      return taskDateStr === dateStr;
    });
    
    
    return filteredTasks;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-slate-200 text-slate-700';
      case 'doing': return 'bg-blue-100 text-blue-700';
      case 'done': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1);
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  const goToNextMonth = () => {
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1);
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  const goToToday = () => {
    const newDate = new Date();
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="relative bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6 h-fit">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
          <div className="text-sm text-slate-600">Loading calendar tasks...</div>
        </div>
      )}
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 min-w-[200px] text-center">
            {monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Legend - Center */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 sm:w-3 h-2 sm:h-3 bg-slate-200 rounded"></div>
            <span className="text-slate-600">Todo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 sm:w-3 h-2 sm:h-3 bg-blue-100 rounded"></div>
            <span className="text-slate-600">Doing</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 sm:w-3 h-2 sm:h-3 bg-emerald-100 rounded"></div>
            <span className="text-slate-600">Done</span>
          </div>
        </div>
        
        <button
          onClick={goToToday}
          className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Day Names Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-slate-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dayTasks = getTasksForDate(day.date);
          const isSelected = selectedDate && selectedDate.toDateString() === day.date.toDateString();
          
          return (
            <div
              key={index}
              className={`
                min-h-[80px] p-1 border border-slate-100 rounded-md cursor-pointer transition-colors
                ${day.isCurrentMonth ? 'bg-white' : 'bg-slate-50'}
                ${day.isToday ? 'ring-2 ring-teal-500' : ''}
                ${isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'}
              `}
              onClick={() => setSelectedDate(day.date)}
            >
              {/* Date Number */}
              <div className={`
                text-xs sm:text-sm font-medium mb-1
                ${day.isCurrentMonth ? 'text-slate-800' : 'text-slate-400'}
                ${day.isToday ? 'text-teal-600' : ''}
              `}>
                {day.date.getDate()}
              </div>

              {/* Tasks */}
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((task, taskIndex) => (
                  <div
                    key={task._id || taskIndex}
                    className={`
                      text-xs px-1 py-0.5 rounded truncate cursor-pointer
                      ${getStatusColor(task.status)}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTaskClick) onTaskClick(task);
                    }}
                    title={`${task.title} (${task.status})`}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-slate-500 px-1">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Calendar;

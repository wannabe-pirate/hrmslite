'use client'

import { useState, useEffect } from 'react';
import { CalendarCheck, Plus, Users, Info, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:8000';

interface Employee {
  id: number;
  emp_id: string;
  full_name: string;
  email: string;
  department: number;
}

interface Department {
  id: number;
  name: string;
}

interface FormData {
  emp_id: string;
  full_name: string;
  email: string;
  department: string;
}

interface FormErrors {
  [key: string]: string;
}

type OrderField = 'emp_id' | 'full_name' | 'email' | 'department' | null;
type OrderDirection = 'asc' | 'desc';

function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showNewDepartmentInput, setShowNewDepartmentInput] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<FormData>({
    emp_id: '',
    full_name: '',
    email: '',
    department: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<OrderField>(null);
  const [orderDirection, setOrderDirection] = useState<OrderDirection>('asc');

  const router = useRouter();

  // Fetch employees on component mount and when search/order changes
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [searchQuery, orderBy, orderDirection]);

  const fetchEmployees = async () => {
    try {
      let url = `${API_BASE_URL}/employees/?`;
      
      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&`;
      }
      
      if (orderBy) {
        const orderPrefix = orderDirection === 'desc' ? '-' : '';
        url += `ordering=${orderPrefix}${orderBy}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setEmployees(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
      setLoading(false);
    }
  };

  const goToAttendance = (employeeID: number) => {
    router.push(`/employee/attendance/?employeeId=${employeeID}`);
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/departments/`);
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.emp_id.trim()) {
      newErrors.emp_id = 'Employee ID is required';
    }
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/departments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDepartmentName.trim(),
        }),
      });

      if (response.ok) {
        const newDepartment = await response.json();
        setDepartments(prev => [...prev, newDepartment]);
        setFormData(prev => ({ ...prev, department: newDepartment.id.toString() }));
        setNewDepartmentName('');
        setShowNewDepartmentInput(false);
        toast.success('Department added successfully');
      } else {
        toast.error('Failed to add department');
      }
    } catch (error) {
      console.error('Error adding department:', error);
      toast.error('Failed to add department');
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/employees/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emp_id: formData.emp_id,
          full_name: formData.full_name,
          email: formData.email,
          department: parseInt(formData.department),
        }),
      });

      if (response.ok) {
        const newEmployee = await response.json();
        setEmployees(prev => [...prev, newEmployee]);
        setFormData({ emp_id: '', full_name: '', email: '', department: '' });
        setIsAddModalOpen(false);
        toast.success(`Employee ${newEmployee.full_name} added successfully!`);
      } else {
        const errorData = await response.json();
        setErrors(errorData);
        toast.error('Failed to add employee');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !selectedEmployee) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/employees/${selectedEmployee.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emp_id: formData.emp_id,
          full_name: formData.full_name,
          email: formData.email,
          department: parseInt(formData.department),
        }),
      });

      if (response.ok) {
        const updatedEmployee = await response.json();
        setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
        setIsEditModalOpen(false);
        setIsEditMode(false);
        setSelectedEmployee(null);
        toast.success(`Employee ${updatedEmployee.full_name} updated successfully!`);
      } else {
        const errorData = await response.json();
        setErrors(errorData);
        toast.error('Failed to update employee');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const response = await fetch(`${API_BASE_URL}/employees/${selectedEmployee.id}/`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id));
        setIsEditModalOpen(false);
        setIsDeleteDialogOpen(false);
        setSelectedEmployee(null);
        setIsEditMode(false);
        toast.success(`Employee ${selectedEmployee.full_name} deleted successfully`);
      } else {
        toast.error('Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      emp_id: employee.emp_id,
      full_name: employee.full_name,
      email: employee.email,
      department: employee.department.toString(),
    });
    setErrors({});
    setIsEditMode(false);
    setIsEditModalOpen(true);
  };

  const getDepartmentName = (deptId: number) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'Unknown';
  };

  const resetForm = () => {
    setFormData({ emp_id: '', full_name: '', email: '', department: '' });
    setErrors({});
    setShowNewDepartmentInput(false);
    setNewDepartmentName('');
  };

  const handleSort = (field: OrderField) => {
    if (orderBy === field) {
      // Toggle direction if same field
      setOrderDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with asc direction
      setOrderBy(field);
      setOrderDirection('asc');
    }
  };

  const getSortIcon = (field: OrderField) => {
    if (orderBy !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return orderDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 text-blue-600" />
      : <ArrowDown className="w-4 h-4 ml-1 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">HRMS Lite</h1>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID *
                </label>
                <Input
                  name="emp_id"
                  value={formData.emp_id}
                  onChange={handleInputChange}
                  placeholder="e.g., MANSOU"
                />
                {errors.emp_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.emp_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Sourav Mandal"
                />
                {errors.full_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g., myselfsourav20@gmail.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <div className="space-y-2">
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleSelectChange(value, 'department')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="add_new" className="text-blue-600 font-medium">
                        + Add New Department
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {formData.department === 'add_new' && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter department name"
                        value={newDepartmentName}
                        onChange={(e) => setNewDepartmentName(e.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={handleAddDepartment}
                        disabled={!newDepartmentName.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>
                {errors.department && (
                  <p className="text-red-500 text-sm mt-1">{errors.department}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Add Employee
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search employees by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleSort('emp_id')}
              >
                <div className="flex items-center">
                  Employee ID
                  {getSortIcon('emp_id')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleSort('full_name')}
              >
                <div className="flex items-center">
                  Full Name
                  {getSortIcon('full_name')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center">
                  Email
                  {getSortIcon('email')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleSort('department')}
              >
                <div className="flex items-center">
                  Department
                  {getSortIcon('department')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {searchQuery ? 'No employees found matching your search.' : 'No employees found. Add your first employee to get started.'}
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.emp_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getDepartmentName(employee.department)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => goToAttendance(employee.id)}
                        className="text-gray-800 hover:text-gray-600 transition flex items-center gap-1 cursor-pointer"
                      >
                        <CalendarCheck className="w-4 h-4" />
                        Attendance
                      </button>
                      <button
                        onClick={() => openEditModal(employee)}
                        className="text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Info className="w-4 h-4" />
                        Info
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Employee Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) {
          setIsEditMode(false);
          setSelectedEmployee(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Employee Information</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateEmployee} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID *
              </label>
              <Input
                name="emp_id"
                value={formData.emp_id}
                onChange={handleInputChange}
                placeholder="e.g., MANSOU"
                disabled={!isEditMode}
                className={!isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''}
              />
              {errors.emp_id && (
                <p className="text-red-500 text-sm mt-1">{errors.emp_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <Input
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="e.g., Sourav Mandal"
                disabled={!isEditMode}
                className={!isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''}
              />
              {errors.full_name && (
                <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g., myselfsourav20@gmail.com"
                disabled={!isEditMode}
                className={!isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <div className="space-y-2">
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleSelectChange(value, 'department')}
                  disabled={!isEditMode}
                >
                  <SelectTrigger className={!isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''}>
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="add_new" className="text-blue-600 font-medium">
                      + Add New Department
                    </SelectItem>
                  </SelectContent>
                </Select>

                {formData.department === 'add_new' && isEditMode && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter department name"
                      value={newDepartmentName}
                      onChange={(e) => setNewDepartmentName(e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={handleAddDepartment}
                      disabled={!newDepartmentName.trim()}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
              {errors.department && (
                <p className="text-red-500 text-sm mt-1">{errors.department}</p>
              )}
            </div>

            {isEditMode ? (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditMode(false);
                    if (selectedEmployee) {
                      setFormData({
                        emp_id: selectedEmployee.emp_id,
                        full_name: selectedEmployee.full_name,
                        email: selectedEmployee.email,
                        department: selectedEmployee.department.toString(),
                      });
                      setErrors({});
                    }
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsEditMode(true);
                  }}
                  className="flex-1"
                >
                  Edit Employee
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsDeleteDialogOpen(true);
                  }}
                  className="flex-1"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Employee
                </Button>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanent Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedEmployee?.full_name}</strong>? 
              This action cannot be undone and will permanently remove this employee from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmployee}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-600">
        Total Employees: {employees.length}
      </div>
    </div>
  );
}

export default EmployeeManagement;
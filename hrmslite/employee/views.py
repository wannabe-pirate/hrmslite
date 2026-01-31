from django.shortcuts import render
from rest_framework import viewsets
from employee.models import Employee, Department, Attendence
from employee.serializers import (
    EmployeeSerializer,
    DepartmentSerializer,
    AttendanceSerialzier,
)

from rest_framework import filters

# Create your views here.
    
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class= EmployeeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['emp_id', 'full_name', 'email', 'department__id', 'department__name']
    ordering_fields = ['emp_id', 'full_name', 'email', 'department__name',]
    
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class AttendenceViewSet(viewsets.ModelViewSet):
    queryset = Attendence.objects.all()
    serializer_class = AttendanceSerialzier
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__id', 'employee__emp_id', 'employee__full_name', 'date',]
    ordering_fields = ['date']
    ordering = ['date']
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from employee.models import Employee, Department, Attendence
from employee.serializers import (
    EmployeeSerializer,
    DepartmentSerializer,
    AttendanceSerialzier,
)

from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend

from django.utils import timezone
from django.db.models import OuterRef, Subquery

# Create your views here.
    
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class= EmployeeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['emp_id', 'full_name', 'email', 'department__id', 'department__name']
    ordering_fields = ['emp_id', 'full_name', 'email', 'department__name',]
    
    def get_queryset(self):
        today = timezone.now().date()

        today_attendance_qs = Attendence.objects.filter(
            employee=OuterRef('pk'),
            date=today
        )

        return Employee.objects.select_related('department').annotate(
            today_attendance_status=Subquery(
                today_attendance_qs.values('status')[:1]
            ),
            today_attendance_id=Subquery(
                today_attendance_qs.values('id')[:1]
            )
        )
        
    
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class AttendenceViewSet(viewsets.ModelViewSet):
    queryset = Attendence.objects.all()
    serializer_class = AttendanceSerialzier
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['employee__emp_id', 'employee__full_name', 'date',]
    filterset_fields = ['employee']
    ordering_fields = ['date']
    ordering = ['date']
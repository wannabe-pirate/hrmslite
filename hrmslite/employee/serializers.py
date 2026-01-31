from employee.models import Department, Employee, Attendence
from rest_framework import serializers, viewsets

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'
    
class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'
    
class AttendanceSerialzier(serializers.ModelSerializer):
    class Meta:
        model = Attendence
        fields = '__all__'
        
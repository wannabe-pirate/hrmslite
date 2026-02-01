from employee.models import Department, Employee, Attendence
from rest_framework import serializers

class EmployeeSerializer(serializers.ModelSerializer):
    today_attendance = serializers.CharField(source='today_attendance_status', read_only=True, allow_null=True)
    today_attendance_id = serializers.IntegerField(read_only=True, allow_null=True)

    
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
        
from django.db import models
from django.core.validators import RegexValidator

no_space_validator = RegexValidator(
    regex=r'^\S+$',
    message='This field cannot contain spaces.'
)

# Create your models here.

class Department(models.Model):
    name = models.CharField(max_length = 50, unique = True, blank = False, )
    
    def __str__(self):
        return self.name

class Employee(models.Model):
    emp_id = models.CharField(
        max_length = 12,
        unique = True, 
        blank = False, 
        null = False, 
        db_index = True,
        validators=[no_space_validator],
    )
    
    full_name = models.CharField(max_length = 120, blank = False, null = False)
    email = models.EmailField(unique = True, blank = False, null = False, )
    department = models.ForeignKey(
        Department,
        on_delete = models.PROTECT,
        related_name = 'employees',
        db_index = True,
    )
    
    def __str__(self):
        return f'{self.full_name} ({self.emp_id})'
    
    
class Attendence(models.Model):
    PRESENT = 'Present'
    ABSENT = 'Absent'
    
    STATUS_CHOICES = [
        (PRESENT , 'Present'),
        (ABSENT, 'Absent'),
    ]
    
    date = models.DateField(blank = False, null = False, db_index = True)
    
    employee = models.ForeignKey(
        Employee,
        on_delete = models.CASCADE,
        related_name = 'attendences',
        db_index = True,
    )
    status = models.CharField(blank = False, null = False, choices = STATUS_CHOICES)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields = ('date', 'employee'),
                name='unique_employee_attendance_per_day'
            )
        ]
        
        indexes = [
            models.Index(
                fields=['employee', 'date'], # useful for empoyees quering employees attendece with a date or date range
                name='index_employee_date'
            )
        ]
    
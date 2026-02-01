from django.urls import path, include
from rest_framework import routers
from employee.views import (
    EmployeeViewSet,
    DepartmentViewSet,
    AttendenceViewSet,
) 

router = routers.DefaultRouter()

router.register(r'employees', EmployeeViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'attendances', AttendenceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
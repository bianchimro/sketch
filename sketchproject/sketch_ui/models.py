from django.db import models
from django.contrib.auth.models import User
from json_field import JSONField

class InterfaceState(models.Model):

    user = models.ForeignKey(User)
    state_name = models.CharField(max_length="300")
    description = models.TextField(max_length="300", null=True, blank=True)
    state = JSONField(null=True, blank=True)


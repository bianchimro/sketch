from django.db import models
from django.contrib.auth.models import User
from json_field import JSONField
import uuid

def generate_oid():
    return str(uuid.uuid4()).replace('-', '')


class InterfaceState(models.Model):
    
    oid = models.CharField(max_length="300", primary_key=True)
    user = models.ForeignKey(User)
    state_name = models.CharField(max_length="300", null=True, blank=True)
    description = models.TextField(max_length="300", null=True, blank=True)
    state = JSONField(null=True, blank=True)
    
    temporary = models.BooleanField(default=True, null=False)
    
    
    def __unicode__(self):
        return u'%s' % self.oid

    
    def save(self, *args, **kwargs):
        if self.oid is None:
            self.oid = generate_oid()
        
        super(InterfaceState, self).save(*args, **kwargs)
import uuid
import datetime

from django.db import models
from django.contrib.auth.models import User

from json_field import JSONField


def generate_oid():
    return str(uuid.uuid4()).replace('-', '')


class InterfaceState(models.Model):
    
    oid = models.CharField(max_length="300", primary_key=True)
    user = models.ForeignKey(User)
    state_name = models.CharField(max_length="300", null=True, blank=True)
    description = models.TextField(max_length="300", null=True, blank=True)
    state = JSONField(null=True, blank=True)
    
    temporary = models.BooleanField(default=True, null=False)
    created = models.DateField(auto_now_add=True)
    last_alive = models.DateField(auto_now=True)
    
    
    def __unicode__(self):
        return u'%s' % self.oid

    
    def save(self, *args, **kwargs):
        if self.oid is None:
            self.oid = generate_oid()
        
        super(InterfaceState, self).save(*args, **kwargs)
        
        

class CollectionReference(models.Model):
    
    interface_state = models.ForeignKey(InterfaceState)
    collection_name = models.CharField(max_length="300")
    last_alive = models.DateField(auto_now=True)
    
    

#todo: move to a Manager
def getObsoleteCollections():
    #now = datetime.datetime.now()
    #old_before = now + datetime.timedelta()
    qset = CollectionReference.objects.filter(interface_state__temporary = True)
    return qset

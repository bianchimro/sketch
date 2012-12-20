import datetime
from sketch.helpers import generate_oid

from django.db import models
from django.contrib.auth.models import User

from json_field import JSONField


class InterfaceState(models.Model):
    
    oid = models.CharField(max_length="300", primary_key=True)
    user = models.ForeignKey(User)
    state_name = models.CharField(max_length="300", null=True, blank=True)
    description = models.TextField(max_length="300", null=True, blank=True)
    state = JSONField(null=True, blank=True)
    
    temporary = models.BooleanField(default=True, null=False)
    created = models.DateField(auto_now=True)
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
"""
def getObsoleteCollections():
    #now = datetime.datetime.now()
    #old_before = now + datetime.timedelta()
    qset = CollectionReference.objects.all()
    return qset
"""

#TODO: review this and move it elsewhere
def dropObsoleteMongoResults():

    out = []
    qset = CollectionReference.objects.all()
    referenced = [obj.collection_name for obj in qset]
    
    from sketch.mongowrapper import mongo, default_mongo_db
    collections = mongo.getDb(default_mongo_db).collection_names()
    for coll in collections:
        if coll.startswith("results"):
            if coll not in referenced:
                out.append(coll)
                mongo.dropCollection(default_mongo_db, coll)
                
    return out
    
    
    
    


from django.db import models
from django.contrib.auth.models import User
from json_field import JSONField


SKETCH_ACCESS_LEVELS = ((1, 'read'), (2, 'write'))


class SketchPermission(models.Model):
    user = models.ForeignKey(User)
    access_level = models.IntegerField(choices = SKETCH_ACCESS_LEVELS)

    class Meta:
        abstract = True

class SketchCollectionPermission(SketchPermission):
    collection = models.ForeignKey('SketchCollection', related_name = "sketch_permissions")
    
    class Meta:
        unique_together = ['user', 'collection']
    
    

class SketchMapper(models.Model):
    name = models.CharField(max_length=200, unique=True)
    mapper = JSONField(null=False, blank=False)
    owner = models.ForeignKey(User)
    access = models.IntegerField(choices = SKETCH_ACCESS_LEVELS)    
    
    
class SketchCollection(models.Model):
    name = models.CharField(max_length=200, unique=True)
    owner = models.ForeignKey(User)
    access_level = models.IntegerField(choices = SKETCH_ACCESS_LEVELS)


    #helpers to get permissions
    def getAccessLevelForUser(self, user):
         try:
            perm = self.sketch_permissions.get(user=user)
            return perm.access_level
         except:
            return None

    def hasWriteAccess(self, user):
        level = self.getAccessLevelForUser(user)
        if level:
            return level >= 2
            
        return False
    
    def hasReadAccess(self, user):
        level = self.getAccessLevelForUser(user)
        if level:
            return level >= 1
            
        return False
        
    #helpers for granting permissions to users

    def setAccessLevel(self, user, access_level):
        try:
            perm = self.sketch_permissions.get(user=user)
            perm.access_level = access_level
        except:
            perm = SketchCollectionPermission(collection=self, user=user, access_level=access_level)
 
        perm.save()
            
    def grantReadAccess(self, user):
        if self.owner is not user:
            self.setAccessLevel(user, 1)
       
    def revokeReadAccess(self, user):
        try:
            perm = self.sketch_permissions.get(user=user)
            perm.delete()
        except:
            pass


    def grantWriteAccess(self, user):
        if self.owner is not user:
            self.setAccessLevel(user, 2)

    def revokeWriteAccess(self, user):
        if self.hasWriteAccess(user):
            self.grantReadAccess(user)

        
        
        



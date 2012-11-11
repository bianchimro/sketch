"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".
"""
from __future__ import absolute_import
from django.test import TestCase
from sketch.mongowrapper import mongo

class MongoWrapperTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)
        
    def test_objects_from_ids(self):
        
        objs = mongo.objects_from_query('sketchdb', 'tweets')
        obj_q = objs[0]
        target_id =  obj_q['_id']

        objs_i = mongo.objects_from_ids('sketchdb', 'tweets', [target_id])
        obj_i = objs_i[0]
        
        self.assertEqual(obj_q, obj_i)
        
        
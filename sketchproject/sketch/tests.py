"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from sketch import mongowrapper

class MongoWrapperTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)
        
    def test_objects_from_ids(self):
        m = mongowrapper.MongoWrapper()
        m.connect()
        
        
        objs = m.objects_from_query('sketchdb', 'tweets')
        obj_q = objs[0]
        target_id =  obj_q['_id']

        objs_i = m.objects_from_ids('sketchdb', 'tweets', [target_id])
        obj_i = objs_i[0]

        m.connection.close()
        
        self.assertEqual(obj_q, obj_i)
        
        
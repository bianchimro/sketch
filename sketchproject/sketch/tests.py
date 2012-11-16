"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".
"""
from __future__ import absolute_import
from django.test import TestCase
from sketch.mongowrapper import mongo
import sketch.operations
import sketch.sources

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
        
    
    def test_operations_mongosource_records(self):
        
        m = sketch.sources.MongoCollectionSource()
        records = m.records({'collection_name' : 'tweets'})
    
    def test_operation_1(self):
        
        m = sketch.operations.SketchOperation('mongo', source_arguments = {'collection_name' : 'tweets'})
        collection_name = m.perform()
        print collection_name
        
        
    def test_operation_formatter(self):
    
        map_operations_data = [{'name' : 'formatters.twitter_geojson'} ]
        m = sketch.operations.SketchOperation('mongo', source_arguments = {'collection_name' : 'tweets'}, map_operations_data=map_operations_data)
        collection_name = m.perform()
        print collection_name
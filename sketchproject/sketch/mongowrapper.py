import datetime
import settings
import pymongo
import json
import bson
import bson.json_util
import uuid

default_mongo_db = settings.MONGO_SERVER_DEFAULT_DB

class MongoWrapper(object):
    """
    This class interacts with Mongo Db instance 
    """
    
    available_commands = ['find_one', 'find', 'count']
    
    def __init__(self, server=None, port=None):
        self.server = server or settings.MONGO_SERVER_HOSTNAME
        self.port = int(port or settings.MONGO_SERVER_PORT)
        self.connection = None
        
    def connect(self):
    
        self.connection = pymongo.Connection(self.server, self.port)
        
        
    def getDb(self, db_name):
    
        db = getattr(self.connection, db_name)
        return db
        
                
    def getCollection(self, db_name, collection_name):
    
        db = self.getDb(db_name)
        collection = getattr(db, collection_name)
        return collection
   
   
    def get_results_collection_name(self, db_name, prefix=''):
        
        database_object = self.getDb(db_name)
        
        while(1):
            existing_collections = database_object.collection_names()
            collection_name = prefix + str(uuid.uuid4()).replace("-", "")       
            if collection_name not in existing_collections:
                coll = self.getCollection(db_name, collection_name)
                return collection_name
        
            
        
    def dropDatabase(self, db_name, ):
        self.connection.drop_database(db_name)
            
    
    def dropCollection(self, db_name, collection_name):
        db = self.getDb(db_name)
        collection = getattr(db, collection_name)
        collection.drop()
    
    
    def dropObjects(self, db_name, collection_name, specs):
        if specs:
            db = self.getDb(db_name)
            collection = getattr(db, collection_name)
            collection.remove(specs, True)
            
    def dropObjectByOid(self, db_name, collection_name, oid):
        if specs:
            db = self.getDb(db_name)
            collection = getattr(db, collection_name)
            collection.remove({"_id" : pymongo.ObjectId(oid)}, True)
        
    
    #todo: implement some gc strategy 
    def dropResultsCollections(self, db_name):
        database_object = self.getDb(db_name)
        existing_collections = database_object.collection_names()
        for coll in existing_collections:
            if coll.startswith('results_'):
                self.dropCollection(db_name, coll)
        
    
    def _insert(self, db_name, collection_name, document):
    
        collection = self.getCollection(db_name, collection_name)
        return collection.insert(document)    
    
    
    def insert(self, db_name, collection_name, request):
    
        document = request.GET.get('document') or request.POST.get('document')
        document = self.parseJsonDict(document)       
        return self._insert(db_name, collection_name, document)
    
    
    def find_one(self, db_name, collection_name, request): 
    
        queryDict = request.GET.get('query') or request.POST.get('query')
        queryDict = self.parseJsonDict(queryDict)
        collection = self.getCollection(db_name, collection_name)
        return collection.find_one(queryDict)
        
    
    def objects_from_ids(self, db_name, collection_name, ids_list):
        
        collection = self.getCollection(db_name, collection_name)
        object_ids = [bson.objectid.ObjectId(x) for x in ids_list]
        query = { "_id" : {"$in" : object_ids }}
        return collection.find(query)
    
    
    def objects_from_query(self, db_name, collection_name, query={}):
        
        collection = self.getCollection(db_name, collection_name)
        return collection.find(query)
    
    
    def objectsFromCollection(self, db_name, collection_name):
        
        collection = self.getCollection(db_name, collection_name)
        return collection.find()
    
    
        
    
    def objects(self, db_name, collection_name, query_dict={}, offset=0, limit=100, formatter_callback=None, write_collection=False):
        """
        Performs find on a collection, with offset and limit parameters
        
        Passing None as limit to this function returns all objects.
        The web view should not permit it.
        
        """
        collection = self.getCollection(db_name, collection_name)
        cursor = collection.find(query_dict)
        
        records = []
        counted = 0
        has_more = False
        collection_out = None
        
        if write_collection:
            offset = 0
            limit = None
            collection_out = self.get_results_collection_name(db_name, prefix='results_')
        
        
        for r in cursor[offset:]:
            if counted < limit or limit is None:
                #TODO: what happens if format_callback fails? Now we skip the record
                if formatter_callback:
                    try:
                        r = formatter_callback(r)
                    except:
                        continue
                if write_collection:
                    self._insert(db_name, collection_out, r)
                else:
                    records.append(r)
                counted += 1
            else:
                has_more = True
                break
        
        out = {'records' : records, 'has_more' : has_more, 'num_records' : counted, 'collection_out' : collection_out }
        return out
    
    
    def find(self, db_name, collection_name, request): 
        
        queryDict = request.GET.get('query') or request.POST.get('query')
        queryDict = self.parseJsonDict(queryDict)

        collection = self.getCollection(db_name, collection_name)
        cursor = collection.find(queryDict)

        out = []
        for r in cursor:
            out.append(r)
        return out
        
        
    def count(self, db_name, collection_name, request): 
        
        queryDict = request.GET.get('query') or request.POST.get('query')
        queryDict = self.parseJsonDict(queryDict)
        
        collection = self.getCollection(db_name, collection_name)
        if queryDict:
            return [collection.find(queryDict).count()]

        return [collection.count()]
        
    def parseJsonDict(self, jsonString):
        #TODO: handle a list of dicts        
        try:
            obj = json.loads(jsonString)
            return dict(obj)
        except:
            return {}
            

#conn pooling
mongo = MongoWrapper()
mongo.connect()

#dropping all existing results
#todo: use some smart gc strategy
mongo.dropResultsCollections(settings.MONGO_SERVER_DEFAULT_DB)





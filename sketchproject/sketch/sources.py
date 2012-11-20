from mongowrapper import mongo, default_mongo_db, results_mongo_db


class SourceManager(object):
    """
    This class is a container for formatter functions.
    """

    def __init__(self):
        self.sources = {}
        
        
    def registerSource(self, name, klass):
        """
        registers a formatting function. 
        It will be referenced by its name.
        """
        self.sources[name] = klass
        
    
    def getSources(self):
        return self.sources.keys()
        
        
    def getSourceInstance(self, name):
        return self.sources[name]()



class BaseSketchSource(object):
    pass

    
    
class MongoCollectionSource(BaseSketchSource):
    
    """
        Performs find on a collection, with offset and limit parameters
        
        Passing None as limit to this function returns all objects.
        The web view should not permit it.
        
    """
    
    def records(self, options):
    
        db_name = options.get('db_name', default_mongo_db)
        collection_name = options['collection_name']
        query_dict = options.get('query_dict', {})
        offset = options.get('offset', 0)
        limit = options.get('limit', 100)
        
        collection = mongo.getCollection(db_name, collection_name)
        cursor = collection.find(query_dict)
        
        records = []
        counted = 0
        has_more = False
        collection_out = None
        
        for r in cursor[offset:]:
            if counted < limit or limit is None:
                yield r





from twitter import *
twitter_search = Twitter(domain="search.twitter.com")

class TwitterAPISource(BaseSketchSource):
    
    """
        
    """
    
    def records(self, options):
    
        #db_name = options.get('db_name', default_mongo_db)
        #collection_name = options['collection_name']
        #query_dict = options.get('query_dict', {})
        offset = options.get('offset', 0)
        limit = options.get('limit', 100)

        q = options['q']
        records = twitter_search.search(q=q, geocode="43.781157,12,100mi")
        
        counted = 0
        has_more = False
        collection_out = None
        
        for r in records['results']:
            if counted < limit or limit is None:
                yield r







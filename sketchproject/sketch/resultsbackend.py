from mongowrapper import mongo, default_mongo_db, results_mongo_db

# Results backend
# TODO: abstract..

class ResultsBackend(object):
    
    def write(self, data, hints):
        
        collection_name = hints.get('collection_name', None)
        prefix = hints.get('prefix', 'results_')
        if not collection_name:
            collection_name = mongo.get_results_collection_name(results_mongo_db, prefix=prefix)
        collection = mongo.getCollection(results_mongo_db, collection_name)
        counted = 0
        for r in data:
            if r.keys():
                mongo._insert(results_mongo_db, collection_name, r)
                counted += 1
                
        if not counted:
            return None
        
        return { 'collection_name' : collection_name, 'num_records': counted}
        
        
    def read(self, data, options):
        raise NotImplementedError()
        

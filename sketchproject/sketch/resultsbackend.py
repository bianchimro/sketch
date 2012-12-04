from mongowrapper import mongo, default_mongo_db, results_mongo_db
from sketch.helpers import generate_oid

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
                oid =  mongo._insert(results_mongo_db, collection_name, r)
                #todo: see if this is applicable, or set an option for it
                if "__sketch_id__" not in r:
                    spec = { "_id" : oid }
                    r['__sketch_id__'] =  str(oid) 
                    mongo._update(results_mongo_db, collection_name, spec, r)
                counted += 1
                
        if not counted:
            return { 'collection_name' : None, 'num_records': counted }
        
        return { 'collection_name' : collection_name, 'num_records': counted}
        
        
    def read(self, data, options):
        raise NotImplementedError()
        

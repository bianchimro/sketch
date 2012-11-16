from sketch import sourcesManager, resultsBackend
from mongowrapper import mongo, default_mongo_db, results_mongo_db

from formattersmanager import formattersManager

# FORMATTERS AND MAPPERS
# FOR NOW WE IMAGINE A STRING PATTERN ... TO BE  CHANGED
# ONLY FOR FORMATTERS RIGHT NOW

class MapOperationWrapper(object):

    def __init__(self, operation):
        self.operation = operation

    def __call__(self, data, *args, **kwargs):
        for d in data:
            yield self.operation(d, *args, **kwargs)


def MapOperationFactory(options):

    name = options['name']
    pieces = name.split('.')
    if pieces[0] == 'formatters':
        wrapper = MapOperationWrapper(formattersManager.getFormatter(pieces[1]))
        return wrapper
    
    raise


def ReduceOperationFactory(options):
    pass



class SketchOperation(object):
    
    def __init__(self, source_name, source_arguments={}, map_operations_data=[], reduce_operations_data=[], save_hints={}):

        self.save_hints = save_hints
        self.source_arguments = source_arguments
        self.source = sourcesManager.getSourceInstance(source_name)
        
        self.map_operations = []
        self.reduce_operations = []

        for op_data in map_operations_data:
            operation = MapOperationFactory(op_data)
            self.map_operations.append(operation)        

        for op_data in reduce_operations_data:
            operation = ReduceOperationFactory(op_data)
            self.reduce_operations.append(operation)        

    
    def perform(self):
        
        data = self.source.records(self.source_arguments)
        map_data = data
        for operation in self.map_operations:
            map_data = operation(map_data)
        
        reduced_data = map_data
        for operation in self.reduce_operations:
            reduced_data = operation(data)
            
        
        results_bucket = resultsBackend.write(reduced_data, hints=self.save_hints)
        return results_bucket
        
    



        
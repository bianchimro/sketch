
class MapOperationFactory(object):

    def __init__(self,data):
        self.data = data

class ReduceOperationFactory(object):

    def __init__(self,data):
        self.data = data

class SourceFactory(object):

    def __init__(self,source_name):
        self.data = source_name




class SketchOperation(object):
    
    def __init__(self, source_name, source_arguments={}, map_operations_data=[], reduce_operations_data=[], save_hints={}):

        self.save_hints = save_hints
        self.source_arguments = source_arguments
        self.source = SourceFactory(source_name)
        
        self.map_operations = []
        self.reduce_operations = []

        for op_data in map_operations_data:
            operation = MapOperationFactory(op_data)
            self.map_operations.append(operation)        

        for op_data in reduce_operations_data:
            operation = ReduceOperationFactory(op_data)
            self.reduce_operations.append(operation)        

    
    def perform(self):
        
        data = self.source.records(source_arguments)
        map_data = data
        for operation in self.map_operations:
            map_data = operation.apply(data)
        
        reduce_data = map_data
        for operation in self.reduce_operations:
            reduced_data = operation.apply(data)
            
        
        results_bucket = sketch.resultsBackend.write(reduced_data, hints=self.save_hints)
        return results_bucket
        
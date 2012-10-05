"""
recordformatter module

"""

from copy import deepcopy


class RecordFormatter(object):
    """
    This class is a container for formatter functions.
    """

    def __init__(self):
        self.formattingFunctions = {}
        
        
    def registerFormattingFunction(self, function):
        """
        registers a formatting function. 
        It will be referenced by its name.
        """
        self.formattingFunctions[function.__name__] = function
        
    
    def getFormatters(self):
        return self.formattingFunctions.keys()
        
        
    def getFormatter(self, name):
        return self.formattingFunctions[name]
        
        
    def formatRecord(self, record, functionName, *args, **kwargs):
        """
        formats a record using the given function name
        """
        
        pf = self.formattingFunctions[functionName]
        return pf(record, *args, **kwargs)
        
        return out
        
        
        
        
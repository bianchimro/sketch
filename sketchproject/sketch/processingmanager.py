"""
processingmanager module.
This module contains an instance of RecordProcessor,
to be used to register processor functions

"""

from recordprocessor import RecordProcessor
import operator

processingManager = RecordProcessor()


#example processing function
def frequentWords(recordsList, *args, **kwargs):
   
    field_name = kwargs.get('field_name', 'text')
    num_words = kwargs.get('num_words', 20)
    min_len = kwargs.get('min_length', 3)

    out = {}
    for record in recordsList:
        text = record.get(field_name)
        if not text:
            continue
        
        words = text.split(" ")
        for word in [x for x in words if len(x) >= min_len]:
            if word not in out:
                out[word] = 0
            out[word] += 1
        
    outSorted = sorted(out.iteritems(), key=operator.itemgetter(1))
    outSorted.reverse()
    outSorted = outSorted[:num_words]
    
    out_records = [{'word': x[0], 'count':x[1]} for x in outSorted]
    return out_records
                
processingManager.registerProcessingFunction(frequentWords)
"""
This module contains an instance of RecordFormatter,
to be used to register formatting funcions
"""

from recordformatter import RecordFormatter
import operator


formattersManager = RecordFormatter()

#TODO: CONSIDER GENERATORS!

#example formatter function
def dummyFormatter(record):
    """
    This function does nothing, it just returns the record.
    """
    
    return record


def foursquare_geojson(object):
    """
    Returns geojson object from a Foursquare data record.
    Only the id attribute is passed in geometric feature property.
    """
    
    loc = object['location']

    properties = dict()
    properties['id'] = object['id']
    
    out =   { "type": "FeatureCollection",
              "features": [
                  { "type": "Feature",
                     "geometry": {"type": "Point", "coordinates": [loc['lat'], loc['lng']] },
                     "properties" : properties
                  }
              ]
            }
    
    return out


def twitter_geojson(object):
    """
    Returns geojson object from a Foursquare data record.
    Only the id attribute is passed in geometric feature property.
    """
    
    
    geom = object['coordinates']

    properties = dict()
    properties['id'] = object['id']
    
    out =     { "type": "Feature",
                     "geometry":  geom ,
                     "properties" : properties
                  }
            
    #TODO: CONSIDER GENERATORS EVERYWHERE IN FORMATTERS
    yield out




#registering the formatting functions
formattersManager.registerFormattingFunction(dummyFormatter)
formattersManager.registerFormattingFunction(foursquare_geojson)
formattersManager.registerFormattingFunction(twitter_geojson)

#TODO: AUTODISCOVER FORMATTING FUNCTIONS
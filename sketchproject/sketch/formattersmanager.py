"""
This module contains an instance of RecordFormatter,
to be used to register formatting funcions
"""

from recordformatter import RecordFormatter
import operator


formattersManager = RecordFormatter()

#TODO: CONSIDER GENERATORS!

#example formatter function
def dummyFormatter(record, *args, **kwargs):
    """
    This function does nothing, it just returns the record.
    """
    
    return record


def foursquare_geojson(object, *args, **kwargs):
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
                     "geometry": {"type": "Point", "coordinates": [loc['lng'], loc['lat']] },
                     "properties" : properties
                  }
              ]
            }
    
    return out


#from geopy import geocoders  
#g = geocoders.Google()

def twitter_geojson(object, *args, **kwargs):
    """
    Returns geojson object from a Foursquare data record.
    Only the id attribute is passed in geometric feature property.
    """
    
    try:
        geom = object['coordinates']
        
        
        properties = dict()
        properties['id'] = object['id']
        
        
        out =     { "type": "Feature",
                         "geometry":  geom ,
                         "properties" : properties
                      }
                
        #TODO: CONSIDER GENERATORS EVERYWHERE IN FORMATTERS
        print "ooo"
        return out
    
    except:
    
        try:
            location = object['location']
            #place, (lat, lng) = g.geocode(location)  
            #out = {'location' : location, 'lat':lat, 'lng' : lng, 'place':place }
            print "aaa"
            return dict()
            
        except:
            print "xxx"
            return dict()




#registering the formatting functions
formattersManager.registerFormattingFunction(dummyFormatter)
formattersManager.registerFormattingFunction(foursquare_geojson)
formattersManager.registerFormattingFunction(twitter_geojson)

#TODO: AUTODISCOVER FORMATTING FUNCTIONS
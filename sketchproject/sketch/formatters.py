"""
This module contains an instance of RecordFormatter,
to be used to register formatting funcions
"""


import operator

#TODO: CONSIDER GENERATORS!

#example formatter function
def dummyFormatter(record, *args, **kwargs):
    """
    This function does nothing, it just returns the record.
    """
    
    return record
    

def foursquare_geojson(record, *args, **kwargs):
    """
    Returns geojson object from a Foursquare data record.
    Only the id attribute is passed in geometric feature property.
    """
    
    loc = record['location']

    #properties = dict()
    #properties['id'] = object['id']
    properties = record
    
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

def twitter_geojson(record, *args, **kwargs):
    """
    Returns geojson object from a Foursquare data record.
    Only the id attribute is passed in geometric feature property.
    """
    
    try:
      
        geom = record['geo']
        try:
            a,b = geom['coordinates']
            geom['coordinates'] = b,a
        except:
            print geom
            pass
        #properties = dict()
        #properties['id'] = object['id']
        properties = record
        
        out =     { "type": "Feature",
                         "geometry":  geom ,
                         "properties" : properties
                      }
                
        return out
    
    except:
        raise
        try:
            location = object['location']
            #place, (lat, lng) = g.geocode(location)  
            #out = {'location' : location, 'lat':lat, 'lng' : lng, 'place':place }
            print "aaa"
            return dict()
            
        except:
            print "xxx"
            return dict()



#TODO: AUTODISCOVER FORMATTING FUNCTIONS
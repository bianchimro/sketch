from resultsbackend import ResultsBackend
from sources import *
from recordformatter import RecordFormatter

resultsBackend = ResultsBackend()

sourcesManager = SourceManager()

sourcesManager.registerSource('mongo', MongoCollectionSource)
sourcesManager.registerSource('twitter', TwitterAPISource)


formattersManager = RecordFormatter()
from sketch.formatters import *
#registering the formatting functions
formattersManager.registerFormattingFunction(dummyFormatter)
formattersManager.registerFormattingFunction(foursquare_geojson)
formattersManager.registerFormattingFunction(twitter_geojson)




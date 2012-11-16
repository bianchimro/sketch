from resultsbackend import ResultsBackend
from sources import *


resultsBackend = ResultsBackend()

sourcesManager = SourceManager()
sourcesManager.registerSource('mongo', MongoCollectionSource)



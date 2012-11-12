from django.template import Context, loader
from django.http import HttpResponse
from django.shortcuts import render, get_object_or_404, render_to_response
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from django.core.serializers.json import DjangoJSONEncoder

import datetime
import settings
import json
import bson
import bson.json_util

import decorators
from mongowrapper import mongo
from helpers import createBaseResponseObject, createResponseObjectWithError
from helpers import getQueryDict, getOffset, getLimit, getFormatter, getMapper, getWriteCollection, getProcessor, instanceDict
from formattersmanager import formattersManager
import recordparser

from models import SketchMapper, SketchCollection





#login view
@csrf_exempt
def ajaxLogin(request):

    message = "No data"

    if request.POST and 'username' in request.POST and 'password' in request.POST:
        username = request.POST['username']
        password = request.POST['password']
        
        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                message = "You provided a correct username and password!"
            else:
                message = "Your account has been disabled!"
        else:
            message = "Your username and password were incorrect."

    return HttpResponse(json.dumps({'message' : message}))



def getServerInfo():
    mongo = MongoWrapper()
    
    try:
        out = createBaseResponseObject()
        mongo.connect()
        existing_dbs = mongo.connection.database_names()
        out['results'] = existing_dbs
    
    except Exception, e:
        out['errors'] = str(e)
        out['status'] = 0
    
    try:
        mongo.connection.close()
    except:
        pass
        
    return out


def server(request):
    out = getServerInfo()
    return HttpResponse(json.dumps(out, default=bson.json_util.default))



#gets info about a database
def getDbInfo(database):
    
    
    try:
        out = createBaseResponseObject()
    
        existing_dbs = mongo.connection.database_names()
        if database not in existing_dbs:
            raise Exception("Database %s does not exist" % database) 
        
        database_object = mongo.getDb(database)
        existing_collections = database_object.collection_names()
        #filtering out "system.indexes" collection
        existing_collections = [x for x in existing_collections if x != "system.indexes"]
        out['results'] = existing_collections
    
    except Exception, e:
        out['errors'] = str(e)
        out['status'] = 0
    
    
    return out


def db(request, database):

    out = getDbInfo(database)
    return HttpResponse(json.dumps(out, default=bson.json_util.default))


def parsers(request):
    
    out = createBaseResponseObject()
    try:
        out['results'] = recordparser.ALLOWED_PARSERS.keys()
    
    except Exception, e:
        out['errors'] = str(e)
        out['status'] = 0
        
    return HttpResponse(json.dumps(out, default=bson.json_util.default))


def transforms(request):
    
    import mappermanager
    transforms = mappermanager.mappingManager.getTransforms()
    
    out = createBaseResponseObject()
    try:
        out['results'] = transforms
    
    except Exception, e:
        out['errors'] = str(e)
        out['status'] = 0
        
    return HttpResponse(json.dumps(out, default=bson.json_util.default))


def processors(request):
    
    import processingmanager
    processors = processingmanager.processingManager.getProcessors()
    
    out = createBaseResponseObject()
    try:
        out['results'] = processors
    
    except Exception, e:
        out['errors'] = str(e)
        out['status'] = 0
        
    return HttpResponse(json.dumps(out, default=bson.json_util.default))


def mappers(request):
    
    out = createBaseResponseObject()
    try:
        maps = SketchMapper.objects.all()
        out['results'] = []
        for map in maps:
            out['results'].append(instanceDict(map))
    
    except Exception, e:
        out['errors'] = str(e)
        out['status'] = 0
        
    return HttpResponse(json.dumps(out, default=bson.json_util.default))



def formatters(request):
    
    import formattersmanager
    formatters = formattersmanager.formattersManager.getFormatters()
    
    out = createBaseResponseObject()
    try:
        out['results'] = formatters
    
    except Exception, e:
        out['errors'] = str(e)
        out['status'] = 0
        
    return HttpResponse(json.dumps(out, default=bson.json_util.default))






#TODO: handle read permissions, with decorator

def query(request, collection, command, database=None):
    """
    View to send commands to handler.
    Deprecated.
    
    """
    out = createBaseResponseObject()

    database = database or settings.MONGO_SERVER_DEFAULT_DB
    
    commandMethod = getattr(mongo, command, None)
    
    try:
        
        if not commandMethod or command not in mongo.available_commands:
            raise Exception("Command %s not supported. Available commands are: %s" % (command, ", ".join(mongo.available_commands)))
    
        existing_dbs = mongo.connection.database_names()
        if database not in existing_dbs:
            raise Exception("Database %s does not exist" % database)
            
        database_object = mongo.getDb(database)
        existing_collections = database_object.collection_names()
        if collection not in existing_collections:
            raise Exception("Collection %s does not exist" % collection)
            
        results = commandMethod(database, collection, request)
        if results:
            out['results'] = results
    
    except Exception, e:
        out['errors'] = str(e)
        out['status'] = 0
    
        
    return HttpResponse(json.dumps(out, default=bson.json_util.default))




#TODO: handle read permissions, with decorator

def objects(request, collection, database=None):
    """
    Query view, gets some objects
    """
    out = createBaseResponseObject()

    database = database or settings.MONGO_SERVER_DEFAULT_DB
    
    try:
        
        existing_dbs = mongo.connection.database_names()
        if database not in existing_dbs:
            raise Exception("Database %s does not exist" % database)
            
        database_object = mongo.getDb(database)
        existing_collections = database_object.collection_names()
        if collection not in existing_collections:
            raise Exception("Collection %s does not exist" % collection)
            
        query_dict = getQueryDict(request)
        offset = getOffset(request)
        limit = getLimit(request)
        write_collection = getWriteCollection(request)
        formatter = getFormatter(request)
        
        formatters = formattersManager.getFormatters()
        if formatter and formatter not in formatters:
            raise Exception("Formatter %s is not available" % str(formatter))
        if formatter:
            formatter_callback = formattersManager.getFormatter(formatter)
        else:
            formatter_callback = None
        
        query_result = mongo.objects(database, collection, query_dict=query_dict, offset=offset, limit=limit, 
                                     formatter_callback=formatter_callback, write_collection=write_collection)
                                     
        out['results'] = query_result['records']
        out['has_more'] = query_result['has_more']
        out['collection_out'] = query_result['collection_out']
    
    except Exception, e:
        raise
        out['errors'] = str(e)
        out['status'] = 0
    
  
    return HttpResponse(json.dumps(out, default=bson.json_util.default))



#TODO: this must be completed
@decorators.login_required
@decorators.can_write_collection
def object(request, collection, oid, database=None):
    """
    Single object view
    """
    
    database = database or settings.MONGO_SERVER_DEFAULT_DB
    
    out = createBaseResponseObject()

    if request.DELETE:
        mongo.dropObjectByOid(database, collection, oid)
        out['results'].append(oid)
      
    return HttpResponse(json.dumps(out, default=bson.json_util.default))



@decorators.login_required
@decorators.can_write_collection
#temporarily remove crsf control to test easily with curl
@csrf_exempt
def importCall(request, collection, database=None):
    """
    View used to import data.
    """
    #this loads an instance of mapper    
    from mappermanager import mappingManager, codedMappers

    #TODO: separate data collection and processing and write a view that handles FILES
    
    out = createBaseResponseObject()
    
    out['error_records'] = { 'parser' : [], 'mapper' : [] }
    out['ok_records_number'] = 0
    
    database = database or settings.MONGO_SERVER_DEFAULT_DB
    
    if request.POST:
        
        mapper = None
        mapperName = getMapper(request)
        #todo: decide to use name or id for referencing mapper in request
        if mapperName:
            if mapperName in codedMappers:
                mapperObject = codedMappers[mapperName]
            else:
                sketchMapper = SketchMapper.objects.get(name=mapperName)
                mapper = sketchMapper.mapper
            
    
        record_errors_number = 0
        ok_records = []
        MAX_ERROR_RECORDS = settings.MAX_ERROR_RECORDS
    
        if 'data' in request.POST and 'parser' in request.POST:
            parser_name = request.POST['parser'].lower()
            data = request.POST['data']
            
            try:
                #parsing phase
                parser = recordparser.parserFactory(parser_name, data)
                for d in parser.objects():
                    if d is recordparser.ParserError:
                        out['error_records']['parser'].append(str(d.exception_message) + ":" +d.raw_data)
                        continue
                    
                    #mapping phase
                    if mapper is not None:
                        try:
                            newRecord = mappingManager.mapRecord(d, mapping, { '__mapper_name__' : mapperName })
                            ok_records.append(newRecord)
                    
                        except:
                            out['error_records']['mapper'].append(d)
    
                    #mapper is none, record is imported as it is
                    else:
                        ok_records.append(d)
                    
                    if len(out['error_records']['mapper']) + len(out['error_records']['parser']) > MAX_ERROR_RECORDS:
                        break
                        
    
                #commit phase
                if 'commit' in request.POST and request.POST['commit']:
                    try:
                        commit = int(request.POST['commit'])
                    except:
                        commit = 0
                        
                    if commit:
                        #creating the collection model and set owner=user if collection does not exits
                        #TODO: we could check again the number of allowed collections here, as in decorator
                        try:
                            collectionInstance = SketchCollection.objects.get(name=collection, database=database)
                        except:
                            collectionInstance = SketchCollection(owner=request.user, name=collection, database=database)
                            collectionInstance.save()
    
                        #finally inserting records
                        for record in ok_records:
                            mongo_id = mongo._insert(database, collection, record)
                            out['results'].append(mongo_id)
                            
            except Exception, e:
                out['errors'] = str(e)
                out['status'] = 0
                 
            out['ok_records_number'] = len(ok_records)
            
        
    return HttpResponse(json.dumps(out, default=bson.json_util.default))
    



#processing view
#TODO: handle read permission
def processObjects(request, collection, database=None):
    """
    this view applies processing to a set of records
    """
    
    #TODO: get the records with a filter or with a list of ids
    #TODO: handle a list of processing functions and argss to be passed in
    #TODO: consider GET vs POST for calling this view. If no records are changed server side,
    #      GET method should be used
    #TODO: consider writing output to a collection
    #TODO: leverage map/reduce when possible
    
    database = database or settings.MONGO_SERVER_DEFAULT_DB
    from processingmanager import processingManager    

    if 'ids' in request.GET:
        ids = request.GET['ids']
        #TODO: get records by id
        records = []
        
    if 'query' in request.GET:
        query = request.GET['query']
        #todo: get records by query
        records = []
        
    if 'in_collection' in request.GET:
        in_collection = request.GET['in_collection']
        records = mongo.objectsFromCollection(database, in_collection)
        
    processor = getProcessor(request)
    if processor not in processingManager.processingFunctions:
        pass
    
            
    #processing cycle
    for record in records:
        pass

    out = createBaseResponseObject()
    
    database = database or settings.MONGO_SERVER_DEFAULT_DB
    
    return HttpResponse(json.dumps(out, default=bson.json_util.default))
    
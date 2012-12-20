import json
import bson.json_util
import os
from django.conf import settings

from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, get_object_or_404, render_to_response
from django.template import RequestContext, loader
from django.core.urlresolvers import reverse
from django.contrib.auth import logout

from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.core import serializers

from sketch.helpers import createBaseResponseObject, createResponseObjectWithError, instanceDict
from models import InterfaceState, CollectionReference, dropObsoleteMongoResults


@login_required(login_url="/login/")
def index(request):
    c = RequestContext(request)
    return render_to_response("sketch_ui/index.html", {}, context_instance = c)

@login_required(login_url="/login/")
def ui(request):
    c = RequestContext(request)
    return render_to_response("ui/index.html", {}, context_instance = c)

def ui_stage(request, state_id):
    state = InterfaceState.objects.get(pk=state_id)
    c = RequestContext(request)
    return render_to_response("ui/stage.html", { 'state': json.dumps(instanceDict(state), cls=DjangoJSONEncoder) }, context_instance = c)



@login_required(login_url="/login/")
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('login'))
    # Redirect to a success page.
    


#TODO: move to separate file
@login_required(login_url="/login/")
def ui_state(request):
    """
    gets or sets interface state. only states of the current user are listed
    """
    c = RequestContext(request)
    out = createBaseResponseObject()
    
    if request.POST:
        oid = request.POST.get('oid', None)
        state_name = request.POST.get('state_name', None)
        description = request.POST.get('description', None)
        state = request.POST.get('state', None)
        
        try:
            obj = InterfaceState.objects.get(oid=oid, user=request.user)
            if description:
                obj.description = description
            if name:
                obj.state_name = state_name
                
            obj.state = state
            obj.save()
            out['results'].append(instanceDict(obj))   
        except:
            obj = InterfaceState(state_name = state_name, user=request.user, state=state, 
                                  description=description, oid=oid)
            try:
                obj.save()
                out['results'].append(instanceDict(obj))                    
            except Exception, e:
                out['errors'].append(str(e))
                out['status'] = 0
            
    else:

        oid = request.GET.get('oid', None)
        if not oid:
            out['errors'].append("You must query a state oid")
            out['status'] = 0
        else:
            try:
                obj = InterfaceState.objects.get(oid=oid, user=request.user)
                out['results'].append(instanceDict(obj))
            except Exception, e:
                out['errors'].append(str(e))
                out['status'] = 0

    return HttpResponse(json.dumps(out, cls=DjangoJSONEncoder))
    
@login_required(login_url="/login/")    
def ui_states(request):
    """
    get all ui_states for the current user
    """
    out = createBaseResponseObject()
    qset = InterfaceState.objects.filter(user=request.user)
    for o in qset:
        out['results'].append(instanceDict(o))
    
    return HttpResponse(json.dumps(out, cls=DjangoJSONEncoder))




@login_required(login_url="/login/")    
def ui_collections_references(request):
    
    out = createBaseResponseObject()
    out['results'] = { 'alive' : [], 'dead':[]}
    
    if request.POST:
    
        alive_collections = request.POST.get('alive_collections', None)
        interface_oid = request.POST.get('oid',None)
        
        try:
            alive_collections = json.loads(alive_collections);
        except:
            alive_collections = []
        
        try:
            interface_state = InterfaceState.objects.get(oid=interface_oid)
        except:
            raise
        
        for collection_name in alive_collections:
            try:
                obj = CollectionReference.objects.get(collection_name=collection_name)
            except:
                obj = CollectionReference(collection_name=collection_name, interface_state=interface_state)
                
            obj.save()
            out['results']['alive'].append(obj.collection_name)
            
        dead_collections = request.POST.get('dead_collections', [])
        try:
            dead_collections = json.loads(dead_collections);
        except:
            dead_collections = []

        #prevents from client stupid requests (#TODO: should raise exception instead!)
        for collection_name in [x for x in dead_collections if x not in alive_collections]:
            try:
                obj = CollectionReference.objects.get(collection_name=collection_name)
                obj.delete()
                out['results']['dead'].append(obj.collection_name)
            except:
                pass
                
        #TODO: move elsewhere!
        dropObsoleteMongoResults()
        
        
    return HttpResponse(json.dumps(out))



def ui_backgrounds(request):
    """
    Lists all available backgrounds
    """
    out = createBaseResponseObject()    
    path = os.path.join(settings.BASE_PATH , "sketch_ui/static/ui/backgrounds")
    files = os.listdir(path)
    for f in files:
        out['results'].append(f)
    
    return HttpResponse(json.dumps(out))
    
    

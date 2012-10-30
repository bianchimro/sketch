import json
import bson.json_util

from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, get_object_or_404, render_to_response
from django.template import RequestContext, loader
from django.core.urlresolvers import reverse
from django.contrib.auth import logout

from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.core import serializers

from sketch.helpers import createBaseResponseObject, createResponseObjectWithError, instanceDict
from models import InterfaceState


@login_required(login_url="/login/")
def index(request):
    c = RequestContext(request)
    return render_to_response("sketch_ui/index.html", {}, context_instance = c)

@login_required(login_url="/login/")
def ui(request):
    c = RequestContext(request)
    return render_to_response("ui/index.html", {}, context_instance = c)

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
        state_name = request.POST.get('state_name', None)
        if not state_name:
            out['errors'].append("You must query a state name")
            out['status'] = 0
        else:
            state = request.POST.get('state', '')
            description = request.POST.get('description', '')
            
            try:
                obj = InterfaceState.objects.get(state_name=state_name, user=request.user)
                obj.state = state
                obj.save()
                out['results'].append(instanceDict(obj))   
            except:
                obj = InterfaceState(state_name = state_name, user=request.user, state=state, 
                                      description=description)
                try:
                    obj.save()
                    out['results'].append(instanceDict(obj))                    
                except Exception, e:
                    out['errors'].append(str(e))
                    out['status'] = 0
            
    else:
        state_name = request.GET.get('state_name', None)
    #if request.GET:
        state_name = request.GET.get('state_name', None)
        if not state_name:
            out['errors'].append("You must query a state name")
            out['status'] = 0
        else:
            try:
                obj = InterfaceState.objects.get(state_name=state_name, user=request.user)
                out['results'].append(instanceDict(obj))
            except Exception, e:
                out['errors'].append(str(e))
                out['status'] = 0

    return HttpResponse(json.dumps(out))
    
@login_required(login_url="/login/")    
def ui_states(request):
    """
    get all ui_states for the current user
    """
    out = createBaseResponseObject()
    qset = InterfaceState.objects.filter(user=request.user)
    for o in qset:
        out['results'].append(instanceDict(o))
    
    return HttpResponse(json.dumps(out))
    
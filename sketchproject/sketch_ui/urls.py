from django.conf.urls import patterns, include, url
from django.views.generic.simple import direct_to_template

urlpatterns = patterns('sketch_ui.views',

    # Examples:
    # url(r'^$', 'sketchproject.views.home', name='home'),
    # url(r'^sketchproject/', include('sketchproject.foo.urls')),
    url(r'index/$', 'index', name="sketch_ui_index"),
    url(r'ui/$', 'ui', name="ui"),
    url(r'ui/state/$', 'ui_state', name="ui_state"),
    url(r'ui/collections_references/$', 'ui_collections_references', name="collections_references"),
    
    url(r'ui/states/$', 'ui_states', name="ui_states"),
    
    url(r'ui/testblock/$', direct_to_template, {'template': 'ui/testblock.html'}),
    url(r'ui/backgrounds/$', 'ui_backgrounds', name="ui_backgrounds"),
    
    
)

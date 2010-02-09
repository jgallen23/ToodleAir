import sys, re

css = open( sys.argv[1] , 'r' ).read()

# remove comments - this will break a lot of hacks :-P
css = re.sub( r'\s*/\*\s*\*/', "$$HACK1$$", css ) # preserve IE<6 comment hack
css = re.sub( r'/\*[\s\S]*?\*/', "", css )
css = css.replace( "$$HACK1$$", '/**/' ) # preserve IE<6 comment hack

# url() doesn't need quotes
css = re.sub( r'url\((["\'])([^)]*)\1\)', r'url(\2)', css )

# spaces may be safely collapsed as generated content will collapse them anyway
css = re.sub( r'\s+', ' ', css )

for rule in re.findall( r'([^{]+){([^}]*)}', css ):

    # we don't need spaces around decendant, and sibling indicators
    selectors = [selector.strip() for selector in rule[0].split( ',' )]

    # order is important, but we still want to discard repetitions
    properties = {}
    porder = []
    for prop in re.findall( '(.*?):(.*?)(;|$)', rule[1] ):
        key = prop[0].strip().lower()
        if key not in porder: porder.append( key )
        properties[ key ] = prop[1].strip()

    # output rule if it contains any declarations
    if properties:
        print ','.join( selectors ) + '{' + \
              ''.join(['%s:%s;' % (key, properties[key]) for key in porder]) + '}'

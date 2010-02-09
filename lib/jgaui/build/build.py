#!/usr/bin/env python

import os
import jsmin

pwd = os.path.dirname(os.path.abspath(__file__))
os.chdir(pwd)

js = {
    'jga': (
        'external/jquery-1.3.1.min.js',
        'external/lowpro.jquery.js',
        'jga.core.js',
        'jga.ui.js',
        'plugins/prettydate.js',
        'plugins/template.js',
        'plugins/tooltip.js'
    ),
    'datepicker': (
        'external/date.js',
        'external/jquery.datePicker.js',
    )
}

css = {
    'datepicker': (
        'external/datePicker.css',
    )
}


for profile in js:
    files = js[profile]
    path = "../lib/scripts/%s.js" % profile
    min_path = "../lib/scripts/%s-min.js" % profile
    if os.path.exists(path):
        os.remove(path)
    if os.path.exists(min_path):
        os.remove(min_path)
    for file in files:
        d = { "file": file, "path": path, "min_path": min_path }
        os.system("cat ../src/scripts/%(file)s >> %(path)s" % d)
        os.system("python jsmin.py <../src/scripts/%(file)s >> %(min_path)s" % d)

for profile in css:
    files = css[profile]
    path = "../lib/stylesheets/%s.css" % profile
    min_path = "../lib/stylesheets/%s-min.css" % profile
    if os.path.exists(path):
        os.remove(path)
    if os.path.exists(min_path):
        os.remove(min_path)
    for file in files:
        d = { "file": file, "path": path, "min_path": min_path }
        os.system("cat ../src/stylesheets/%(file)s >> %(path)s" % d)
        os.system("python cssmin.py ../src/stylesheets/%(file)s >> %(min_path)s" % d)


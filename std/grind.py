#!/usr/bin/env python
#-*- encoding: utf-8 -*-
""" Grind human-readable CSL tests into machine-readable form

    When invoked directly as a script, this module converts
    a set of human-readable CSL test files into the JSON
    format used for processor testing.

/*
 * Copyright (c) Frank G. Bennett, Jr. 2009. All Rights Reserved.
 *
 * The contents of this file are subject to the Common Public
 * Attribution License Version 1.0 (the “License”); you may not use
 * this file except in compliance with the License. You may obtain a
 * copy of the License at:
 *
 * http://bitbucket.org/fbennett/citeproc-js/src/tip/LICENSE.
 *
 * The License is based on the Mozilla Public License Version 1.1 but
 * Sections 14 and 15 have been added to cover use of software over a
 * computer network and provide for limited attribution for the
 * Original Developer. In addition, Exhibit A has been modified to be
 * consistent with Exhibit B.
 *
 * Software distributed under the License is distributed on an “AS IS”
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is the citation formatting software known as
 * "citeproc-js" (an implementation of the Citation Style Language
 * [CSL]), including the original test fixtures and software located
 * under the ./std subdirectory of the distribution archive.
 *
 * The Original Developer is not the Initial Developer and is
 * __________. If left blank, the Original Developer is the Initial
 * Developer.
 *
 * The Initial Developer of the Original Code is Frank G. Bennett,
 * Jr. All portions of the code written by Frank G. Bennett, Jr. are
 * Copyright (c) Frank G. Bennett, Jr. 2009. All Rights Reserved.
 */
    
"""
import sys,os,re
import tempfile
from cStringIO import StringIO
from time import time
try:
    import json
except:
    import simplejson as json
from xml.etree import ElementTree


namespace = 'xmlns="http://purl.org/net/xbiblio/csl"'

def indent(elem, level=0):
    i = "\n" + level*"  "
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = i + "  "
        if not elem.tail or not elem.tail.strip():
            elem.tail = i
        for elem in elem:
            indent(elem, level+1)
        if not elem.tail or not elem.tail.strip():
            elem.tail = i
    else:
        if level and (not elem.tail or not elem.tail.strip()):
            elem.tail = i

#
# Encoding non-ascii characters in the human readable test files 
# as JSON ordinarily causes a UnicodeEncodeError, if the Python
# default encoding is set to the (factory default) value of "ascii".
# I was unable to find a means of enabling UTF-8 support in
# simplejson, and have resorted to the Big Hammer Method, which
# involves reloading the sys module (to restore the
# setdefaultencoding method that Python ordinarily deletes on
# startup), and clobbering the system default value, replacing
# it with "utf-8".  This is said to be a hack, and is said to
# run the risk of subtle incompatibilities with other libraries,
# but it works here for Python versions > 2.1 or so.
# 
# For further details, see http://faassen.n--tree.net/blog/view/weblog/2005/08/02/0
# and the posts linked in the first paragraph of that blog entry. 
#
reload(sys)
sys.setdefaultencoding("utf-8") # Needs Python Unicode build !
    
class CslTestUtils:
    """ Constants and utility methods

    This provides a regular expression to identify data blocks within
    the human-readable tests files, a list of the valid CSL author
    field names, and a little utility method for building paths during
    processing.  These are shared with CslTests and with CslTest.
    """
    def __init__(self):
	self.CREATORS = ["author","editor","translator","recipient","interviewer"]
        self.CREATORS += ["composer","original-author","container-author","collection-editor"]
        self.RE_ELEMENT = '(?sm)^(.*>>=.*%s[^\n]+)(.*)(\n<<=.*%s.*)'
        self.RE_FILENAME = '^[a-z]+_[a-zA-Z0-9]+\.txt'
    
    def path(self,*elements):
        return os.path.join( os.getcwd(), *elements )

class CslTests(CslTestUtils):
    """ Control class for processing a set of tests

    Instantiates a list of human-readable test names derived from
    the filesystem.  Provides a method for clearing the content
    of the machine-readable directory and processing the
    human-readable files.
    """
    def __init__(self, args=[], options={}):
        self.options = options
        CslTestUtils.__init__(self)
        self.tests = []
        self.args = args
        for filename in os.listdir( self.path( "humans" ) ):
            p = self.path("humans", filename)
            if not os.path.stat.S_ISREG( os.stat(p).st_mode ) or not re.match(self.RE_FILENAME,filename):
                continue
            if p.endswith("~") or p.endswith(".orig"):
                continue
            testname = os.path.splitext(filename)[0]
            if len(self.args):
                if not testname in self.args:
                    continue
                elif os.path.exists( self.path( "machines", "%s.json"%testname)):
                    os.unlink( self.path( "machines", "%s.json"%testname ))
            self.tests.append(testname)
        self.tests.sort()

    def clear(self):
        for file in os.listdir( self.path("machines") ):
            p = self.path("machines", file)
            if os.path.stat.S_ISREG( os.stat(p).st_mode ):
                os.unlink( p )

    def process(self):
        if not len(self.args) and not os.path.exists("ABORTED.txt"):
            self.clear()
        if os.path.exists("ABORTED.txt"):
            os.unlink("ABORTED.txt")
        for testname in self.tests:
            test = CslTest(testname, options=self.options)
            if test.load():
                test.parse()
                ## test.fix_source()
                test.fix_names()
                test.validate(testname)
                test.dump_machines()
                test.dump_humans()
        sys.stdout.write("\n")

class CslTest(CslTestUtils):
    """ Handler for an individual test file

    Instantiates a single test, and provides
    methods for loading its raw data, parsing and massaging
    the content, and dumping the result, both in a reformatted
    human-readable and in a machine-readable form.
    """
    def __init__(self,testname, options={}):
        CslTestUtils.__init__(self)
        if options.be_verbose:
            sys.stdout.write( "%s\n" %testname)
        else:
            sys.stdout.write(".")
        sys.stdout.flush()
        self.options = options
        self.testname = testname
        self.data = {}

    def load(self):
        if not os.path.exists(self.path("machines","%s.json" % self.testname)):
            self.raw = open( "%s.txt" % (self.path("humans",self.testname),) ).read()
            return True

    def parse(self):
        for element in ["MODE","SCHEMA","CSL","RESULT"]:
            self.extract(element,required=True,is_json=False)
        self.extract("INPUT",required=True,is_json=True)
        self.extract("ABBREVIATIONS",required=False,is_json=True)
        self.extract("CITATIONS",required=False,is_json=True)
        self.extract("BIBENTRIES",required=False,is_json=True)

    def extract(self,tag,required=False,is_json=False):
        m = re.match(self.RE_ELEMENT %(tag,tag),self.raw)
        data = False
        if m:
            data = m.group(2).strip()
        elif required:
            print "Ooops, missing element: %s in test %s" %(tag,self.testname)
            sys.exit()
        if data != False:
            if is_json:
                data = json.loads(data)
            self.data[tag.lower()] = data

    def fix_source(self):
        """ Convert options to attributes, write back to source file.
            (now disabled)
        """
        mycsl = self.data["csl"].replace(namespace,'')
        et = ElementTree.fromstring(mycsl)
        for tagname in ["citation", "bibliography"]:
            opts = et.findall(".//%s/option" % tagname)
            tag = et.findall(".//%s" % tagname)
            if tag and len(tag):
                tag = tag[0]
                for opt in opts:
                    tag.attrib[opt.attrib["name"]] = opt.attrib["value"]
                    tag.remove(opt)
        indent(et)
        str = ElementTree.tostring(et).strip()
        for tagname in ["style", "citation", "bibliography"]:
            str = self.format_attributes(tagname,str)
        m = re.match(self.RE_ELEMENT % ("CSL", "CSL"),self.raw)
        newraw = m.group(1) + "\n" + str + m.group(3)
        open( "%s.txt" % (self.path("humans",self.testname),), "w+" ).write(newraw)

    def format_attributes(self,tag,str):
        #print "before: "+tag
        m = re.match("(?m)(?s).*?(\s+|)<%s\s+([^>]*)>.*" % tag,str)
        #print "after"
        if m:
            #print "----------------->Found style: %s" % m.group(2)
            #print len(m.group(1))
            attribs = re.split("\s+", m.group(2))
            #print attribs
            j = "\n      " + " " * len(m.group(1))                
            attribs = j + j.join(attribs)
            if tag == "style":
                attribs = j + namespace + attribs
            str = re.sub("(<"+tag+"\s+)[^>]*(>)","\\1"+attribs+"\\2",str)
        #style = re.sub("<style[^>]*>",citationtag,style)
        #style = re.sub("<style[^>]*>",bibliographytag,style)
        return str

    def fix_names(self):
        """ Mangle name fields

        This method converts names from the shorthand format
        used in the "name" field in the INPUT area of the human-readable 
        test files to the more explicit format recognized by the processor
        API.
        """
        for item in self.data["input"]:
            for key in [unicode(i) for i in self.CREATORS]:
                if item.has_key(key):
                    for entry in item[key]:
                        if not entry.has_key("name"):
                            continue
                        one_char = len(entry["name"])-1
                        two_chars = one_char-1
                        entry["static-ordering"] = False
                        if entry["name"].endswith("!!"):
                            entry["literal"] = entry["name"][0:-2].strip()
                        else:
                            parsed = entry["name"]
                            if entry["name"].endswith("!"):
                                entry["static-ordering"] = True
                                parsed = entry["name"][0:-1].strip()
                            parsed = re.split("\s*,\s*",parsed)

                            if len(parsed) > 0:
                                m = re.match("^\s*([a-z]+)\s+(.*)",parsed[0])
                                if m:
                                    entry["non-dropping-particle"] = m.group(1)
                                    entry["family"] = m.group(2)
                                else:
                                    entry["family"] = parsed[0]
                            if len(parsed) > 1:
                                m = re.match("(.*?)\s+([a-z]+)\s*$",parsed[1])
                                if m:
                                    entry["dropping-particle"] = m.group(2)
                                    entry["given"] = m.group(1)
                                else:
                                    entry["given"] = parsed[1];
                            if len(parsed) > 2:
                                m = re.match("\!\s*(.*)",parsed[2])
                                if m:
                                    entry["suffix"] = m.group(1)
                                    entry["comma_suffix"] = True
                                else:
                                    entry["suffix"] = parsed[2]
                        del entry["name"]


    def fix_dates(self):
        for pos in range(0, len(self.data["input"]),1):
            for k in ["issued", "event", "accessed", "container", "original-date"]:
                if self.data["input"][pos].has_key(k):
                    newdate = []
                    if not self.data["input"][pos][k].has_key("date-parts"):
                        start = []
                        for e in ["year","month","day"]:
                            if self.data["input"][pos][k].has_key(e):
                                start.append( self.data["input"][pos][k][e] )
                                self.data["input"][pos][k].pop(e)
                            else:
                                break
                        if start:
                            newdate.append(start)
                        end = []
                        for e in ["year_end","month_end","day_end"]:
                            if self.data["input"][pos][k].has_key(e):
                                end.append( self.data["input"][pos][k][e] )
                                self.data["input"][pos][k].pop(e)
                            else:
                                break
                        if end:
                            newdate.append(end)
                        self.data["input"][pos][k]["date-parts"] = newdate
     
    def validate(self,testname):
        if not self.options.be_cranky:
            return
        if not os.path.exists("../../jing"):
            print "Error: jing not found as sibling of processor archive."
            sys.exit()
        if not os.path.exists("../csl/csl.rnc"):
            print "Error: csl.rnc not found in csl subdirectory of archive"
            sys.exit()
        tfd,tfilename = tempfile.mkstemp(dir=".")
        os.write(tfd,self.data["csl"])
        os.close(tfd)
        
        jfh = os.popen("java -jar ../../jing/bin/jing.jar -c ../csl/csl.rnc %s" % tfilename)
        success = True
        plural = ""
        while 1:
            line = jfh.readline()
            if not line: break
            line = line.strip()
            e = re.match("^fatal:",line)
            if e:
                print line
                sys.exit()
            m = re.match(".*:([0-9]+):([0-9]+):  *error:(.*)",line)
            if m:
              if success:
                  print "\n##"
                  print "#### Error%s in CSL for test: %s" % (plural,testname)
                  print "##\n"
                  success = False
              print "  %s @ line %s" %(m.group(3).upper(),m.group(1))
              plural = "s"
        jfh.close()
        os.unlink(tfilename)
        if not success:
            print ""
            io = StringIO()
            io.write(self.data["csl"])
            io.seek(0)
            linepos = 1
            while 1:
                cslline = io.readline()
                if not cslline: break
                cslline = cslline.rstrip()
                print "%3d  %s" % (linepos,cslline)
                linepos += 1
            open("ABORTED.txt","w+").write("boo\n")
            sys.exit()

    def dump_machines(self):
        if not os.path.exists( self.path("machines")):
            os.makedirs( self.path("machines"))
        tpath_out = "%s.json" % (self.path("machines", self.testname),)
        json.dump(self.data, open(tpath_out,"w+"), indent=4, sort_keys=True, ensure_ascii=False )
        
    def dump_humans(self):
        self.fix_dates()
        str = json.dumps(self.data["input"],indent=4,sort_keys=True,ensure_ascii=False)
        m = re.match(self.RE_ELEMENT % ("INPUT", "INPUT"),self.raw)
        newraw = m.group(1) + "\n" + str + m.group(3)
        tpath_out = "%s.txt" % (self.path("humans", self.testname),)
        open(tpath_out,"w+").write(newraw)

if __name__ == "__main__":
    from optparse import OptionParser
    usage = '''
      %prog [options] [[testname] ...]
'''.rstrip()

    prefix = "%s%s" % (os.path.curdir, os.path.sep)
    description=''' This script converts human-friendly test files for
the CSL bibliography system into the machine-friendly JSON format.
The script should be located in the top-level directory of the test
suite, with an immediate subdirectory %shumans/ that contains the
human-readable test files.  Machine-readable files will be written
into the %smachines/ subdirectory.  When the script is run without
options (or with the -v option only), the content of the %smachines/ 
directory will be deleted, and all files in %shumans/ directory will
be processed.  If the names of one or more tests are given as
arguments, existing files in %smachines/ will not be deleted, and only
the named test files will be processed.
'''.strip() % (prefix,prefix,prefix,prefix,prefix)

    parser = OptionParser(usage=usage,description=description,epilog="Happy testing!")
    parser.add_option("-v", "--verbose", dest="be_verbose",
                      default=False,
                      action="store_true", 
                      help='Display test names during processing.')
    parser.add_option("-c", "--cranky", dest="be_cranky",
                      default=False,
                      action="store_true", 
                      help='Attempt to validate CSL files before processing.')
    (options, args) = parser.parse_args()

    if options.be_cranky:
        options.be_verbose = True
        import time
 
 
    #if len(args) > 0:
    #    options.be_verbose = True
    
    mypath = os.path.split(sys.argv[0])[0]
    if len(mypath):
        os.chdir(mypath)

    tests = CslTests( args=args, options=options )
    tests.process()


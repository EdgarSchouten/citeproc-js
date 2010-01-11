/*
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights Reserved.
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
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights Reserved.
 */
++++++++++
README.txt
++++++++++
===============
``citeproc-js``
===============

.. container:: center
   
   Frank Bennett

   *Graduate School of Law, Nagoya University*

   2009.08.20

--------------------

This is an effort to implement a full-featured standalone CSL
processor in Javascript, for use by the Zotero project, and by other
sites and platforms that can benefit from a standard method of
formatting citation data.


The Architecture
----------------

The processor manual is included in this source archive.  A
nicely formatted version is available online:

   http://gsl-nagoya-u.net/http/pub/citeproc-doc.html

In rough outline, there is a two-stage instantiation and build process
(Build and Configure) that constructs an object with a few methods
useful for loading CSL styles and rendering citations and
bibliographies.

The processor object has several sub-objects, the most important of
which are "registry", "citation", "bibliography", "citation_sort" and
"bibliography_sort".  The top-level methods on the main object apply
execution wrappers to token lists contained in "citation" and
"bibliography", to produce string or list-of-string output.  The
"registry" object provides a persistent store for managing
bibliography sort order and disambiguation.  The output queue in this
scenario is built as a nested hierarchy which is then collapsed into a
formatted string for output.


Testing, testing ...
--------------------

As you can see from the sources, tests are kind of important here.
Javascript is notoriously unfriendly when it comes to debugging, the
processor is charged with an extremely complex formatting task, and
the target community (us) is unforgiving.  Things have to work
correctly, and the only way to assure that they do is to test the code
thoroughly.

Test suites are useful to us in all sorts of ways.  Standard tests
(housed under ./std) help to assure that the various CSL
implementations produce identical results.  The internal tests
specific to citeproc-js provide insurance against unexpected
side-effects in the event of wholesale refactoring (of which there has
been more than I would like to remember).  Tests are not just about
QA; they help to keep complexity from running out of control, by
forcing the programmer (me) to confront it regularly when changes are
made to the codebase.  The suites are an integral part of the
development process; if you modify or add code to the processor (and
contributions are welcome!), be sure to complement your changes with
tests.  It's the right thing to do.


Archive Layout
--------------

The sources of the program are under ./src.  The ./locale and ./style
directories contain standard files from the CSL distribution, for 
use in testing.  The tests are located under ./tests (for those
specific to citeproc-js) and ./std (for the standard CSL test
fixtures).

The basic testing framework we use is DOH, from the Dojo project.
If your machine has Java installed, the ./dojo and ./rhino directories
provide the remaining infrastructure needed to run the tests via the
./runtests.sh or ./runtests.bat scripts.

The ./data directory contains input files for running tests.  Over
time, this material will be moved into the standard test suite
area, and this directory will eventually go away.  The ./ref directory
contains a grab-bag of documents and files stashed or shoved aside
during development.


Standard tests and test scripts
-------------------------------

Standard tests are shipped in two subdirectories, ``./std/humans`` and
``./std/machines``.  New tests and editorial changes should be made in the
``./std/humans`` directory, populating the changes to the ``./std/machines``
directory using the ``./std/grind.py`` Python script (``grind.py`` can also be
used for validation -- run it with the ``--help`` option for more info).
The actual test runners use the machine-readable form of the tests.

Running in ``rhino``: ``runtests.sh``
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The primary script that runs all the tests is ``./run-rhino.sh``, in the 
top-level directory.  Rintze Zelle has very kindly provided a 
``./run-rhino.bat`` file as well, and the tests reportedly run (and we 
hope also break) equally well on Windows boxes.

If you have a Java interpreter installed and are on Linux (or possibly
a Mac), you can run the tests in a checkout from a terminal by
entering the top directory and just typing the runtests script
appropriate for your system.

On Windows, the ``./run-rhino.bat`` file can be run from the command prompt, 
the only caveat being that the command prompt should be set to the drive 
harboring the SVN working copy, e.g. 
``D:\>D:\xbiblio\citeproc-js\trunk\runtests.bat`` works whereas 
``C:\>D:\xbiblio\citeproc-js\trunk\runtests.bat`` 
gives an error when executed.

Running in ``spidermonkey``: ``test.py``
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The ``./run-spidermonkey.py`` script runs the tests using a standalone Spidermonkey
interpreter similar to that used in Firefox. The  kit used for this purpose
is the ``python-spidermonkey`` bridge done by Paul Davis, which is available, 
with install instructions, here:

  http://github.com/davisp/python-spidermonkey/tree/master


Running in ``tracemonkey``: ``runtracem.sh``
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The ``tracemonkey`` Javascript engine is significantly faster than either
``spidermonkey`` or ``rhino``, and is used by the ``run-tracemonkey.sh``
script.  To run it you will need to do the following on a Linux system:

1. Download the sources of `the jslibs development environment`__. 

2. Compile the sources with ``make all; make copy`` (under Linux)
   or by whatever means is appropriate to your operating system.

3. Enter the directory ``./libs/js/src`` in the ``jslibs`` source
   archive, and compile the js interpreter as well.  This will generate
   the ``libmozjs.so`` shared library.

4. Make a note of the path to the ``jshost`` binary, and of the path
   to the ``libmozjs.so`` library.

5. Register ``libmozjs.so`` in the operating system's dynamic linker.
   This is normally done by placing a file containing the relevant path
   (less the actual name of the library) under ``/etc/ld.so.conf.d/``,
   in a file with a ``.conf`` extension.

6. Run the command ``ldconfig`` to complete registration of the library
   path.

7. Return to the ``citeproc-js`` archive, and edit the paths as necessary in the file 
   ``./tests/runner_tracemonkey.js``.

8. Try running the ``./run-tracemonkey.sh`` script and see if it works.

__ http://code.google.com/p/jslibs/source/checkout

Other Info
----------

Information on writing tests using the DOH framework can be found here:

  http://www.ibm.com/developerworks/web/library/wa-aj-doh/index.html

The DOH testing framework is part of the Dojo project.  The dojo
framework files under ``./dojo`` are from a release instance of the
product compiled from the original source.  (Compiling from scratch
was necessary in order to run DOH from the command line as we do
here.) If you want to use DOH for your own projects, the sources for
Dojo are available here:

  http://download.dojotoolkit.org/

Note that various small changes have been made to the DOH code that
ships with ``citeproc-js``, including the deletion of one line of the code
in order to avoid a timeout issue on my very small and rather slow
laptop.

Enjoy!

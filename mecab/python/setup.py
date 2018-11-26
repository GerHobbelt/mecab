#!/usr/bin/env python

import os
import subprocess
import sys

from setuptools import setup, Extension


def mecab_config(arg):
	output = subprocess.check_output(["mecab-config", arg])

	if not isinstance(output, str):
		output = output.decode("utf-8")

	return output.split()

is_windows = os.name == 'nt'

is_64bits = sys.maxsize > 2**32

# Assuming Windows mecab binary, headers, dlls are put into following directory
win_mecab_dir = r'C:\mecab'
win_sdk_dir = win_mecab_dir
win_bin_dir = win_mecab_dir
# If you want to use official Windows binary, you can comment out following variables
#win_mecab_dir = r'C:\Program Files{}\MeCab'.format('' if is_64bits else ' (x86)')
#win_sdk_dir = r'{}\sdk'.format(win_mecab_dir)
#win_bin_dir = r'{}\bin'.format(win_mecab_dir)

include_dirs = [win_sdk_dir] if is_windows else mecab-config("--inc-dir")
library_dirs = [win_sdk_dir] if is_windows else mecab-config("--libs-only-L")
libraries = ["libmecab"] if is_windows else mecab-config("--libs-only-l")
data_files = [("lib\\site-packages\\", ["{}\\libmecab.dll".format(win_bin_dir)])] if is_windows else []

setup(name = "mecab-python",
	version = "0.996.1",
	py_modules = ["MeCab"],
	data_files = data_files,
	ext_modules = [
		Extension("_MeCab",
			["MeCab_wrap.cxx",],
			include_dirs=include_dirs,
			library_dirs=library_dirs,
			libraries=libraries)
			],
	maintainer = "Aki Ariga",
	maintainer_email = "chezou@gmail.com",
	description = "Python wrapper for MeCab on Windows",
	platforms = ["Windows"],
	classifiers = [
		"Development Status :: 3 - Alpha",
		"Operating System :: Microsoft :: Windows",
		"Programming Language :: Python :: 3.5",
		"Programming Language :: Python :: 3.6",
		"Programming Language :: Python :: 3.7",
		"Topic :: Scientific/Engineering :: Information Analysis",
		"Topic :: Text Processing :: Linguistic",
		"License :: OSI Approved :: BSD License",
		"License :: OSI Approved :: GNU General Public License (GPL)",
		"License :: OSI Approved :: GNU Library or Lesser General Public License (LGPL)"
	],
    long_description='''This is a python wrapper for MeCab on Windows.

    License
    ---------
    MeCab is copyrighted free software by Taku Kudo <taku@chasen.org> and Nippon Telegraph and Telephone Corporation, and is released under any of the GPL (see the file GPL), the LGPL (see the file LGPL), or the BSD License (see the file BSD).
    '''
)

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
# If you want to use official Windows binary, you can comment out following variables
#win_mecab_dir = r'C:\Program Files{}\MeCab'.format('' if is_64bits else ' (x86)')
#win_sdk_dir = r'{}\sdk'.format(win_mecab_dir)

include_dirs = [win_sdk_dir] if is_windows else mecab-config("--inc-dir")
library_dirs = [win_sdk_dir] if is_windows else mecab-config("--libs-only-L")
libraries = ["libmecab"] if is_windows else mecab-config("--libs-only-l")
data_files = [("lib\\site-packages\\", ["{}\\libmecab.dll".format(win_sdk_dir)])] if is_windows else []

setup(name = "mecab-python",
	version = '0.996.1',
	py_modules=["MeCab"],
	data_files = data_files,
	ext_modules = [
		Extension("_MeCab",
			["MeCab_wrap.cxx",],
			include_dirs=include_dirs,
			library_dirs=library_dirs,
			libraries=libraries)
			])

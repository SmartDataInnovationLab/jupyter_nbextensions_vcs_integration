from setuptools import setup, find_packages
import os

print("setup.py has been called")

setup(
    name="test",
    version="0.0.1",
    description="test for Jupyter Notebook",
    packages=find_packages(),
    package_data={
    	'jupyter_nbextensions_vcs_integration': [
            'jupyter_nbextensions_vcs_integration/main.js',
            'jupyter_nbextensions_vcs_integration/__init__.py']
    }
)

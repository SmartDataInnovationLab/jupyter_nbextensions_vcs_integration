from setuptools import setup, find_packages
import os

# get paths to all the extension files
extension_files = []
for (dirname, dirnames, filenames) in os.walk("vcs_integration/nbextensions"):
    root = os.path.relpath(dirname, "vcs_integration")
    for filename in filenames:
        if filename.endswith(".pyc"):
            continue
        extension_files.append(os.path.join(root, filename))

print(extension_files)

setup(
    name="VCS Integration",
    version="0.1.0",
    description="VCS Integration for Jupyter Notebook",
    packages=find_packages(),
    package_data={
    	'vcs_integration': extension_files
    }
)


# explanation: http://jupyter-notebook.readthedocs.io/en/stable/examples/Notebook/Distributing%20Jupyter%20Extensions%20as%20Python%20Packages.html#Defining-the-server-extension-and-nbextension

def _jupyter_server_extension_paths():
    return [{
        "module": "jupyter_nbextensions_vcs_integration"
    }]

# Jupyter Extension points
def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        # the path is relative to the `jupyter_nbextensions_vcs_integration` directory
        src="static",
        # directory in the `nbextension/` namespace
        dest="jupyter_nbextensions_vcs_integration",
        # _also_ in the `nbextension/` namespace
        require="jupyter_nbextensions_vcs_integration/main")]

def load_jupyter_server_extension(nbapp):
    nbapp.log.info("jupyter_nbextensions_vcs_integration enabled!")

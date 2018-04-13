def _jupyter_server_extension_paths():
    return [{
        "module": "jupyter_nbextensions_vcs_integration"
    }]

def _jupyter_nbextension_paths():
	return [dict(
		section="notebook",
		src="jupyter_nbextensions_vcs_integration/serverextension",
		dest="jupyter_nbextensions_vcs_integration/serverextension",
		require="jupyter_nbextensions_vcs_integration/nbextensions/notebook/main")]

def load_jupyter_server_extension(nbapp):
    nbapp.log.info("[VCS Integration] Enabled server extension")


FROM jupyter/minimal-notebook
RUN python3 -m pip install -e git+https://github.com/jupyter/nbdime#egg=nbdime

USER root
WORKDIR /root

RUN nbdime reg-extensions --system

ADD src /src
WORKDIR /src
RUN python3 -m pip install .
RUN jupyter nbextension install jupyter_nbextensions_vcs_integration --symlink
RUN jupyter nbextension enable jupyter_nbextensions_vcs_integration/main
RUN jupyter serverextension enable --py jupyter_nbextensions_vcs_integration  --system

USER jovyan
WORKDIR /home/jovyan


# run with
# docker build -t ipgit . ;and docker run -it -p 8888:8888 -v (pwd)/src:/src ipgit

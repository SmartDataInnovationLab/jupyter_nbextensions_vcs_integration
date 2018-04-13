
FROM jupyter/minimal-notebook
RUN python3 -m pip install nbdime

USER root
WORKDIR /root

RUN nbdime reg-extensions --system

ADD src /src
WORKDIR /src
RUN python3 -m pip install .
RUN jupyter nbextension install jupyter_nbextensions_vcs_integration --symlink
RUN jupyter nbextension enable jupyter_nbextensions_vcs_integration/nbextensions/notebook/main
RUN jupyter serverextension enable --py jupyter_nbextensions_vcs_integration  --system

USER jovyan
WORKDIR /home/jovyan

# setup some dummy repos to get started
RUN git config --global user.email "you@example.com" && git config --global user.name "Your Name"
RUN mkdir central_repo && cd central_repo && git init --bare
RUN git clone central_repo downstream1
RUN echo '{"cells":[{"cell_type":"code","execution_count":null,"metadata":{},"outputs":[],"source":[]}],"metadata":{"kernelspec":{"display_name":"Python 3","language":"python","name":"python3"}},"nbformat":4,"nbformat_minor":2}' >> downstream1/notebook.ipynb
RUN cd downstream1 && git add . && git commit -am "." && git push
RUN git clone central_repo downstream2

# run with
# docker build -t ipgit . && docker run -it -p 8888:8888 -v $(pwd)/src:/src ipgit

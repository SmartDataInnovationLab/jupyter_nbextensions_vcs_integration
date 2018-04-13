# Installation

## Install system-wide
1. Open a terminal
2. Navigate to this folder, then:

        pip install . # may require root
        jupyter nbextension install vcs_integration --symlink
        jupyter nbextension enable vcs_integration/nbextensions/notebook/main
        jupyter nbextension enable vcs_integration/nbextensions/tree/main
        jupyter serverextension enable --py vcs_integration --system

7. Test the installation
    *  Frontend extension:
        1. Open a notebook
        2. open Developer Tools of the browser (usually Ctrl + Shift + I or F12)
        3. check console output for:`[VCS Integration] Init`
      * Server extension:
        1. Start jupyter notebook (via terminal)
        2. check the output for: `[VCS Integration] Enabled server extension`


## Install into conda environment from inside jupyter notbook

1. Start jupyter inside conda environment

        conda create -n test
        source activate test # windows: "activate test" instead
        jupyter notebook

2. Open a notebook
3. create a new cell

        %cd /home/juergens/dev/jupyter-extensions/vcs_integration # change path accordingly
        !pip install -e .
        !jupyter nbextension install vcs_integration --sys-prefix
        !jupyter nbextension enable vcs_integration/nbextensions/notebook/main
        !jupyter nbextension enable vcs_integration/nbextensions/tree/main
        !jupyter serverextension enable --py vcs_integration --sys-prefix
        %cd -

4. Execute cell
5. Reload site (F5 in browser). No need to restart server

### uninstall


    !jupyter serverextension disable --py vcs_integration
    !jupyter nbextension disable vcs_integration/nbextensions/tree/main
    !jupyter nbextension disable vcs_integration/nbextensions/notebook/main
    !jupyter nbextension uninstall vcs_integration
    !yes|pip uninstall vcs_integration


# Local Testing
1. Open a terminal
2. Navigate to where you would like to have the test repositories
3. Create the central repository: `mkdir central_repo && cd central_repo && git init --bare`
4. Create local copies: `git clone /path/to/central_repo person_(a|b|c|...)`
5. Now you can push / pull to / from the central repository
  - e.g. person_1 pushes and person_2 pulls
  - inside person_1: git push
  - inside person_2: git pull


# Current problems
- Save before commiting?
- one menu just for git branch (shows current by default, on click shows all possible)



# Refactor
- 1 vcs = 1 module (e.g git or svn)
- let user choose the vcs (or autodetect?)

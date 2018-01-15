#!/usr/bin/env python
import os
import os.path
import sys
import pwd

PROG = "bpaotu"

production_user = "apache"
in_production = os.path.basename(sys.argv[0]) == PROG

if in_production:
    (uid, gid, gecos, homedir) = pwd.getpwnam(production_user)[2:6]
    try:
        os.setgid(gid)
        os.setuid(uid)
    except OSError as e:
        sys.stderr.write("%s\nThis program needs to be run as the " % e)
        sys.stderr.write("%s user, or root.\n" % production_user)
        sys.exit(1)
    else:
        os.environ["HOME"] = homedir

if __name__ == "__main__":
    if in_production:
        print("{0} Django manage in production".format(PROG))
        # setup the settings module for the django app
        from ccg_django_utils.conf import setup_prod_env

        setup_prod_env(PROG)
    else:
        print("{0} Django manage develop".format(PROG))
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "%s.settings" % PROG)

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)

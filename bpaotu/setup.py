import os.path
import ast
from setuptools import setup, find_packages


def get_data_files():
    """
    Dictionary of data files
    """
    current_dir = os.getcwd()
    data_files = {}
    for package in packages:
        data_files[package] = []
        os.chdir(os.path.join(package))
        for data_dir in ('templates', 'static', 'migrations', 'fixtures', 'features', 'templatetags', 'management'):
            data_files[package].extend(
                [os.path.join(subdir, f) for (subdir, dirs, files) in os.walk(data_dir) for f in files])
        os.chdir(current_dir)
    return data_files


def find_version():
    """Return value of __version__.
    """
    file_path = os.path.join(os.path.dirname(__file__), 'bpaotu', '_version.py')
    with open(file_path) as file_obj:
        root_node = ast.parse(file_obj.read())
    for node in ast.walk(root_node):
        if isinstance(node, ast.Assign):
            if len(node.targets) == 1 and node.targets[0].id == "__version__":
                return node.value.s
    raise RuntimeError("Unable to find version string.")


version=find_version()
packages = [p.replace(".", "/") for p in sorted(find_packages())]
package_scripts = ["manage.py"]
package_data = get_data_files()

setup(name='bpaotu',
      version=version,
      description="BPA OTU",
      author='Centre for Comparative Genomics',
      author_email='help@bioplatforms.com',
      packages=packages,
      package_data=package_data,
      include_package_data=True,
      zip_safe=False,
      scripts=package_scripts, )

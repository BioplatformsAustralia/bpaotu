import os
import subprocess
from django.core.management.base import BaseCommand

# usage:
# python bpaotu/manage.py export_comparison_examples
class Command(BaseCommand):
    help = "Export sample comparison code example notebooks to Python and R files using nbconvert"

    def handle(self, *args, **options):
        base_dir = os.path.join("/app", "bpaotu", "bpaotu", "resources", "examples")

        if not os.path.isdir(base_dir):
            raise RuntimeError(f"Directory not found: {base_dir}")

        notebooks = [
            f for f in os.listdir(base_dir)
            if f.endswith(".ipynb")
        ]

        if notebooks:
            self.stdout.write("Notebooks found:")
            for notebook in notebooks:
                self.stdout.write(f"  {notebook}")
        else:
            self.stdout.write("No notebooks found.")
            return

        for notebook in notebooks:
            notebook_path = os.path.join(base_dir, notebook)
            base_name = notebook.replace(".ipynb", "")
            code_type = base_name.replace("make_comparison_code_example_", "")
            if code_type == "python":
                extension = "py"
            elif code_type.lower() in ("r", "rscript"):
                extension = "R"
            else:
                continue

            output_file = os.path.join(base_dir, f"comparison_code_{code_type}_example")
            output_file_ext = f"{output_file}.{extension}"

            self.stdout.write(f"Exporting: {code_type} notebook: {notebook}")

            if code_type == "python":
                subprocess.run([
                    "jupyter", "nbconvert",
                    "--to", "script",
                    "--output", output_file,
                    notebook_path
                ], check=True)

                # Remove "# In[xx]:" markers from Python export
                with open(output_file_ext, "r") as f:
                    lines = f.readlines()

                cleaned = []
                for line in lines:
                    if line.lstrip().startswith("# In[") and line.rstrip().endswith("]:"):
                        continue  # skip nbconvert cell marker
                    cleaned.append(line)

                with open(output_file_ext, "w") as f:
                    f.writelines(cleaned)

            if code_type == "R":
                subprocess.run([
                    "jupyter", "nbconvert",
                    "--to", "script",
                    "--output", output_file,
                    notebook_path
                ], check=True)

                # rename file so that extension is an uppercase R
                # (nbconvert makes filename extension lowercase)
                generated = f"{output_file}.r"
                if os.path.exists(generated):
                    os.rename(generated, output_file_ext)

            self.stdout.write(self.style.SUCCESS(f"✓ {notebook} exported to {output_file_ext}"))
